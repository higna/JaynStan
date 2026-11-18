ALTER TABLE featured_works
  ADD COLUMN IF NOT EXISTS content_type varchar(24) NOT NULL DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS content_body text,
  ADD COLUMN IF NOT EXISTS offer varchar(120),
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE featured_works DROP CONSTRAINT IF EXISTS featured_works_content_type_check;
ALTER TABLE featured_works ADD CONSTRAINT featured_works_content_type_check
  CHECK (content_type IN ('project', 'website', 'pdf', 'video', 'writing', 'event', 'class'));
CREATE INDEX IF NOT EXISTS featured_works_content_type_idx ON featured_works (content_type, created_at DESC);
