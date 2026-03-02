
-- Confirm the user's email
UPDATE auth.users SET email_confirmed_at = now() WHERE id = '06941fee-9316-4c76-baa0-4e374c994492' AND email_confirmed_at IS NULL;

-- Set role to admin
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '06941fee-9316-4c76-baa0-4e374c994492';

-- Insert admin role if not exists
INSERT INTO public.user_roles (user_id, role)
SELECT '06941fee-9316-4c76-baa0-4e374c994492', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '06941fee-9316-4c76-baa0-4e374c994492');
