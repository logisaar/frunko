-- Ensure admins can create subscriptions for any user
-- Drop and recreate the admin policy to ensure it covers all operations
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));