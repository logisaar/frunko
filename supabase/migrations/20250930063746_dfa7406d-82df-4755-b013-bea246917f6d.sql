-- Fix RLS policies for plans table to allow admin operations
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;

CREATE POLICY "Admins can manage plans"
ON public.plans
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Ensure items table also has proper admin policies
DROP POLICY IF EXISTS "Admins can manage items" ON public.items;

CREATE POLICY "Admins can manage items"
ON public.items
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));