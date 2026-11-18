import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { MailService } from '../common/services/mail.service.js';
import type { AuthenticatedUser } from '../auth/provider-categories.js';

type TicketRow = {
  id: string; reference: string; user_id: string | null; sender_name: string; sender_email: string;
  subject: string; initial_message: string; status: string; email_sent: boolean; created_at: Date;
  updated_at: Date; settled_at: Date | null; settlement_email_sent: boolean;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly database: DatabaseService, private readonly mail: MailService, private readonly config: ConfigService) {}

  async submit(input: { name: string; email: string; subject?: string; message: string }, user?: AuthenticatedUser) {
    const name = user?.fullName ?? input.name.trim();
    const email = user?.email ?? input.email.trim().toLowerCase();
    const subject = input.subject?.replace(/[\r\n\t]/g, ' ').trim().slice(0, 120) || 'Support request';
    const message = input.message.trim();
    const reference = `JS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const ticketId = randomUUID();

    await this.database.query(
      `INSERT INTO support_tickets (id, reference, user_id, sender_name, sender_email, subject, initial_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ticketId, reference, user?.id ?? null, name, email, subject, message],
    );

    const recipient = this.config.get<string>('SUPPORT_EMAIL') || this.config.get<string>('BREVO_SENDER_EMAIL');
    const sent = recipient ? await this.mail.sendBrandedEmail({
      to: recipient,
      subject: `[${reference}] ${subject}`,
      preheader: `New ${subject.toLowerCase()} enquiry from ${name}`,
      eyebrow: `Support ticket ${reference}`,
      title: subject,
      bodyHtml: `<p><strong>From:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>`,
      bodyText: `Ticket ${reference}\nSubject: ${subject}\nName: ${name}\nEmail: ${email}\n\n${message}`,
      note: 'This request is saved in the JaynStan support dashboard. Reply to the sender from the ticket inbox.',
    }) : false;
    await this.database.query('UPDATE support_tickets SET email_sent = $2, updated_at = now() WHERE id = $1', [ticketId, sent]);
    if (!sent) this.logger.warn(`Support ticket ${reference} was created but the support email could not be delivered.`);

    return {
      accepted: true,
      ticket: { reference, status: 'open' },
      emailSent: sent,
      message: sent ? `Ticket ${reference} has been created and sent to support.` : `Ticket ${reference} has been created. Email notification could not be delivered.`,
    };
  }

  async listTickets() {
    const result = await this.database.query(
      `SELECT t.id, t.reference, t.sender_name AS "senderName", t.sender_email AS "senderEmail",
              t.subject, t.initial_message AS "initialMessage", t.status, t.email_sent AS "emailSent",
              t.created_at AS "createdAt", t.updated_at AS "updatedAt", t.settled_at AS "settledAt",
              t.settlement_email_sent AS "settlementEmailSent", u.full_name AS "accountName",
              COALESCE((SELECT json_agg(json_build_object(
                'id', r.id, 'message', r.message, 'createdAt', r.created_at,
                'senderName', COALESCE(author.full_name, 'JaynStan Support'), 'emailSent', r.email_sent
              ) ORDER BY r.created_at ASC) FROM support_ticket_replies r
                LEFT JOIN users author ON author.id = r.sender_id WHERE r.ticket_id = t.id), '[]'::json) AS replies
       FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id
       ORDER BY CASE WHEN t.status IN ('open', 'in_progress') THEN 0 ELSE 1 END, t.updated_at DESC`,
    );
    return result.rows;
  }

  async replyToTicket(ticketId: string, sender: AuthenticatedUser, messageInput: string) {
    const message = messageInput.trim();
    const result = await this.database.query<TicketRow>(
      `SELECT id, reference, user_id, sender_name, sender_email, subject, initial_message, status,
              email_sent, created_at, updated_at, settled_at, settlement_email_sent
       FROM support_tickets WHERE id = $1`, [ticketId],
    );
    const ticket = result.rows[0];
    if (!ticket) throw new NotFoundException('Support ticket not found.');
    if (['settled', 'resolved', 'closed'].includes(ticket.status)) throw new ConflictException('This ticket is settled. Reopen it before replying.');

    const replyId = randomUUID();
    await this.database.transaction(async (client) => {
      await client.query(
        'INSERT INTO support_ticket_replies (id, ticket_id, sender_id, message) VALUES ($1, $2, $3, $4)',
        [replyId, ticketId, sender.id, message],
      );
      await client.query("UPDATE support_tickets SET status = 'in_progress', updated_at = now() WHERE id = $1", [ticketId]);
    });

    const sent = await this.mail.sendBrandedEmail({
      to: ticket.sender_email,
      subject: `Re: [${ticket.reference}] ${ticket.subject}`,
      preheader: `A reply from JaynStan support about ${ticket.subject}.`,
      eyebrow: `Support ticket ${ticket.reference}`,
      title: 'A message from our team',
      bodyHtml: `<p>Hello ${escapeHtml(ticket.sender_name)},</p><p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>`,
      bodyText: `Hello ${ticket.sender_name},\n\n${message}\n\nTicket ${ticket.reference}`,
      note: `This reply is about your support request: ${ticket.subject}. Reply to this email if you need to add more information.`,
    });
    await this.database.query('UPDATE support_ticket_replies SET email_sent = $2 WHERE id = $1', [replyId, sent]);
    if (!sent) this.logger.warn(`Reply to support ticket ${ticket.reference} was saved but not emailed.`);
    return { id: replyId, emailSent: sent, message: sent ? 'Reply sent to the requester.' : 'Reply saved, but email delivery failed.' };
  }

  async settleTicket(ticketId: string, admin: AuthenticatedUser) {
    const result = await this.database.query<TicketRow>(
      `SELECT id, reference, user_id, sender_name, sender_email, subject, initial_message, status,
              email_sent, created_at, updated_at, settled_at, settlement_email_sent
       FROM support_tickets WHERE id = $1`, [ticketId],
    );
    const ticket = result.rows[0];
    if (!ticket) throw new NotFoundException('Support ticket not found.');
    if (!['settled', 'resolved', 'closed'].includes(ticket.status)) {
      await this.database.query("UPDATE support_tickets SET status = 'settled', settled_at = now(), settled_by = $2, updated_at = now() WHERE id = $1", [ticketId, admin.id]);
    }
    if (ticket.settlement_email_sent) return { settled: true, emailSent: true, message: 'Ticket is already settled and the requester has been notified.' };

    const sent = await this.mail.sendBrandedEmail({
      to: ticket.sender_email,
      subject: `Your JaynStan support ticket ${ticket.reference} is settled`,
      preheader: `Your request “${ticket.subject}” has been marked as settled.`,
      eyebrow: `Ticket ${ticket.reference}`,
      title: 'Your support request is settled',
      bodyHtml: `<p>Hello ${escapeHtml(ticket.sender_name)},</p><p>We’ve marked your support request, <strong>${escapeHtml(ticket.subject)}</strong>, as settled.</p><p>If you still need help, contact us again and include ticket reference ${escapeHtml(ticket.reference)}.</p>`,
      bodyText: `Hello ${ticket.sender_name},\n\nWe’ve marked your support request “${ticket.subject}” as settled.\n\nIf you still need help, contact us again and include ticket reference ${ticket.reference}.`,
      note: 'Thank you for contacting JaynStan Support.',
    });
    await this.database.query('UPDATE support_tickets SET settlement_email_sent = $2, updated_at = now() WHERE id = $1', [ticketId, sent]);
    if (!sent) this.logger.warn(`Support ticket ${ticket.reference} was settled, but the requester email could not be delivered.`);
    return { settled: true, emailSent: sent, message: sent ? 'Ticket settled and requester notified.' : 'Ticket settled, but the requester email could not be delivered.' };
  }
}
