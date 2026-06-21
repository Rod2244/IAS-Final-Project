-- Table to store one-time OTP codes for MFA
CREATE TABLE IF NOT EXISTS public.user_otps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  purpose varchar NOT NULL DEFAULT 'mfa',
  code_hash varchar NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON public.user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_user_id_purpose ON public.user_otps(user_id, purpose);
