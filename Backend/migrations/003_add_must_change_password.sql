-- Migration to add password change tracking for student accounts
-- Add must_change_password flag to users table
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Create index for faster lookups of users requiring password change
CREATE INDEX IF NOT EXISTS idx_users_must_change_password 
ON public.users(must_change_password) 
WHERE must_change_password = true;

-- Add audit comment
COMMENT ON COLUMN public.users.must_change_password IS 'Flag to require password change on next login for accounts with temporary passwords';
