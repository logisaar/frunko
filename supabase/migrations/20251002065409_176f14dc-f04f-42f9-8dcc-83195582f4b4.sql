-- Update user role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'bpskar2@gmail.com';