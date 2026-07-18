-- Tighten RLS policies for quotes and ai_interactions to require authentication

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create interactions" ON public.ai_interactions;

-- Create stricter policy requiring authentication for ai_interactions INSERT
CREATE POLICY "Authenticated users can create interactions" 
ON public.ai_interactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Note: quotes table already has user_id based policies, but let's ensure they're consistent
-- The existing validation trigger already handles input validation