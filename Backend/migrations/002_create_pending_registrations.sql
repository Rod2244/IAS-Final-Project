-- Migration: create pending_registrations table
-- Temporary store for teacher/faculty email verification before real account creation
CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  password_nonce TEXT NOT NULL,
  password_tag TEXT NOT NULL,
  role TEXT NOT NULL,
  profile_data JSONB,
  verification_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
