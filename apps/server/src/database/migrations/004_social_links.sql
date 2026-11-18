CREATE TABLE IF NOT EXISTS social_links (
  platform varchar(20) PRIMARY KEY CHECK (platform IN ('facebook', 'whatsapp', 'twitter', 'instagram')),
  url text,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO social_links (platform, url, is_enabled) VALUES
  ('facebook', NULL, false), ('whatsapp', NULL, false), ('twitter', NULL, false), ('instagram', NULL, false)
ON CONFLICT (platform) DO NOTHING;
