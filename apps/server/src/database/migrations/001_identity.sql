CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  full_name varchar(160) NOT NULL,
  email varchar(320) NOT NULL,
  password_hash text,
  google_subject varchar(255),
  profile_image_url text,
  phone varchar(40),
  role varchar(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_login_method_check CHECK (password_hash IS NOT NULL OR google_subject IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_google_subject_unique ON users (google_subject) WHERE google_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS provider_applications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name varchar(160) NOT NULL,
  phone varchar(40) NOT NULL,
  category varchar(40) NOT NULL CHECK (category IN ('software-development', 'graphic-design', 'artwork-painting', 'architecture')),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_applications_one_pending_per_user
  ON provider_applications (user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS provider_applications_status_created_idx
  ON provider_applications (status, created_at DESC);
