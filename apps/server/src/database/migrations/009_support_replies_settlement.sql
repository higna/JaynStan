ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS subject varchar(120) NOT NULL DEFAULT 'Support request';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS settled_at timestamptz;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS settled_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS settlement_email_sent boolean NOT NULL DEFAULT false;

UPDATE support_tickets
SET subject = COALESCE(NULLIF(substring(initial_message FROM '^Subject: ([^\n]*)'), ''), subject),
    initial_message = regexp_replace(initial_message, '^Subject: [^\n]*\n\n', '')
WHERE initial_message LIKE 'Subject:%';

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
UPDATE support_tickets SET status = 'settled' WHERE status IN ('resolved', 'closed');
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'in_progress', 'settled', 'resolved', 'closed'));

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  message text NOT NULL,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_ticket_replies_ticket_created_idx
  ON support_ticket_replies (ticket_id, created_at ASC);
