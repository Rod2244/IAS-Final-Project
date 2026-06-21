-- Persistent lockout table for authentication hardening
-- Run this SQL against your Supabase database to enable DB-backed lockout state.

CREATE TABLE IF NOT EXISTS public.auth_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  failed_attempts integer NOT NULL DEFAULT 0,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  lockout_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_lockouts_email ON public.auth_lockouts(email);
