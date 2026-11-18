CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY,
  reference varchar(32) NOT NULL UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  sender_name varchar(160) NOT NULL,
  sender_email varchar(320) NOT NULL,
  initial_message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx ON support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx ON support_tickets (status, created_at DESC);
