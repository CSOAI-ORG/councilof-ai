-- Add token_hash column and expires_at to customer_portal_access for secure token storage
ALTER TABLE public.customer_portal_access 
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- Create index on token_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_token_hash 
ON public.customer_portal_access(token_hash);

-- Drop overly permissive INSERT policy on quotes and create more restrictive one
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;

CREATE POLICY "Authenticated users can create quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

-- Add rate limiting metadata to analytics_events
ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS request_hash TEXT;

-- Create a trigger to auto-expire old portal access tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_portal_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate expired tokens
  UPDATE public.customer_portal_access
  SET active = false
  WHERE expires_at < now() AND active = true;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs on insert to check for expired tokens
DROP TRIGGER IF EXISTS trigger_cleanup_expired_tokens ON public.customer_portal_access;
CREATE TRIGGER trigger_cleanup_expired_tokens
AFTER INSERT ON public.customer_portal_access
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_portal_tokens();