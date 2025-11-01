-- Fix RLS policy for reviews to allow users to submit reviews without requiring an order_id
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create reviews for their orders" ON public.reviews;

-- Create a new policy that allows authenticated users to create reviews
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Keep the other policies as they are
-- "Anyone can view reviews" - already exists
-- "Users can update their own reviews" - already exists
-- "Admins can manage all reviews" - already exists
