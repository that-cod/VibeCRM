-- OPTION 2: Quick SQL Fix for Mock User
-- Run this if you want to keep the hardcoded mock UUID

-- Drop FK constraint to auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Now insert mock user (will work without auth.users entry)
INSERT INTO public.users (id, email, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@vibecrm.com',
  'Demo User',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- Verify it worked
SELECT * FROM public.users WHERE email = 'demo@vibecrm.com';
