CREATE TABLE IF NOT EXISTS user_disciplines (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discipline varchar(40) NOT NULL CHECK (discipline IN ('software-development', 'graphic-design', 'artwork-painting', 'architecture')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, discipline)
);

CREATE INDEX IF NOT EXISTS user_disciplines_discipline_idx ON user_disciplines (discipline);
