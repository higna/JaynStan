CREATE TABLE IF NOT EXISTS homepage_stats (
  stat_key varchar(40) PRIMARY KEY,
  label varchar(80) NOT NULL,
  value varchar(24) NOT NULL,
  unit varchar(24) NOT NULL DEFAULT '',
  sort_order smallint NOT NULL UNIQUE,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO homepage_stats (stat_key, label, value, unit, sort_order) VALUES
  ('clients', 'Clients served', '100', '+', 1),
  ('satisfaction', 'Satisfaction rating', '98', '%', 2),
  ('disciplines', 'Creative disciplines', '4', '', 3),
  ('collective', 'Creative collective', '1', '', 4)
ON CONFLICT (stat_key) DO NOTHING;
