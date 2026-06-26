-- Migration to add missing must_change_password field and relax teachers table constraints
-- Run this in your Supabase SQL editor

-- Add missing must_change_password field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Relax teachers table constraints to allow NULL values
ALTER TABLE teachers 
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN last_name DROP NOT NULL,
ALTER COLUMN employee_id DROP NOT NULL,
DROP CONSTRAINT IF EXISTS teachers_employee_id_key;

-- Update existing admin users to ensure they have proper settings
UPDATE users 
SET must_change_password = FALSE 
WHERE role = 'admin';
