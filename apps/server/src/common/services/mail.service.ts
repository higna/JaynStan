import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CustomEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BrandedEmail {
  to: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  action?: { label: string; url: string };
  note?: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendBrandedEmail(message: BrandedEmail): Promise<boolean> {
    return this.sendCustomEmail({
      to: message.to,
      subject: message.subject,
      html: this.renderBrandedEmail(message),
      text: [message.title, message.bodyText, message.action ? `${message.action.label}: ${message.action.url}` : '', message.note ?? ''].filter(Boolean).join('\n\n'),
    });
  }

  private renderBrandedEmail(message: BrandedEmail): string {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://jaynstan.com').replace(/\/$/, '');
    const logoUrl = this.config.get<string>('EMAIL_LOGO_URL') || `${frontendUrl}/JaynStan.png`;
    const logo = logoUrl
      ? `<img src="${escapeHtml(logoUrl)}" width="132" height="42" alt="JaynStan Espire Enclave" style="display:block;width:132px;height:42px;object-fit:contain;object-position:left center;border:0;margin:0 0 14px;">`
      : '<span style="display:block;margin:0 0 14px;color:#e6c34f;font-size:19px;font-weight:800;letter-spacing:2px;">JAYNSTAN</span>';
    const actionUrl = message.action ? escapeHtml(message.action.url) : '';
    const action = message.action ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 18px;">
        <tr><td align="center" bgcolor="#e6c34f" style="border-radius:999px;">
          <a href="${actionUrl}" style="display:inline-block;padding:14px 24px;border:1px solid #e6c34f;border-radius:999px;color:#17170f;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:.3px;text-decoration:none;">${escapeHtml(message.action.label)}</a>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;color:#77776d;font-size:12px;line-height:1.7;">If the button does not open, copy this address into your browser:<br><a href="${actionUrl}" style="color:#927411;word-break:break-all;">${actionUrl}</a></p>` : '';
    const note = message.note ? `<tr><td style="padding:16px 30px 20px;border-top:1px solid #eeede7;color:#77776d;font-size:12px;line-height:1.65;">${escapeHtml(message.note)}</td></tr>` : '';

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(message.title)}</title></head>
<body style="margin:0;padding:0;background:#f2f0e8;color:#202018;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(message.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f2f0e8" style="width:100%;background:#f2f0e8;">
    <tr><td align="center" style="padding:38px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;background:#fffefa;border:1px solid #e6e3d8;border-radius:18px;overflow:hidden;">
        <tr><td height="5" bgcolor="#e6c34f" style="height:5px;background:#e6c34f;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 30px 23px;background:#17170f;color:#f4f1e8;">
          ${logo}
          <p style="margin:0;color:#e6c34f;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(message.eyebrow)}</p>
        </td></tr>
        <tr><td style="padding:30px;">
          <h1 style="margin:0 0 18px;color:#202018;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:600;line-height:1.15;">${escapeHtml(message.title)}</h1>
          <div style="color:#55554c;font-size:15px;line-height:1.75;">${message.bodyHtml}</div>
          ${action}
        </td></tr>
        ${note}
        <tr><td style="padding:18px 30px;background:#17170f;color:#c7c3b5;font-size:11px;line-height:1.6;">
          <strong style="color:#e6c34f;letter-spacing:1px;">JAYNSTAN ESPIRE ENCLAVE</strong><br>Creative work, brought together by one collective.
        </td></tr>
      </table>
      <p style="margin:18px 0 0;color:#89877c;font-size:10px;line-height:1.5;">This is an automated message from JaynStan. Please do not reply directly to this email.</p>
    </td></tr>
  </table>
</body></html>`;
  }

  async sendCustomEmail(message: CustomEmail): Promise<boolean> {
    const enabled = this.config.get<string>('MAIL_ENABLED') === 'true';
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL');
    const senderName = this.config.get<string>('BREVO_SENDER_NAME', 'JaynStan');

    if (!enabled || !apiKey || !senderEmail) {
      this.logger.warn('Email delivery is disabled or missing Brevo configuration.');
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          ...(message.text ? { textContent: message.text } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.logger.error(`Brevo email request failed with status ${response.status}.`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Brevo email request failed: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }
}
