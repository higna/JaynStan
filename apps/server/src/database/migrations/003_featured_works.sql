CREATE TABLE IF NOT EXISTS featured_works (
  id uuid PRIMARY KEY,
  title varchar(180) NOT NULL,
  category varchar(40) NOT NULL CHECK (category IN ('software-development', 'graphic-design', 'artwork-painting', 'architecture')),
  description text NOT NULL,
  image_url text NOT NULL,
  work_url text,
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS featured_works_public_idx ON featured_works (is_featured, created_at DESC);
