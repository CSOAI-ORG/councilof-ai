-- Create terms acceptances table for GDPR-compliant audit trail
CREATE TABLE public.terms_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  terms_version TEXT NOT NULL,
  privacy_version TEXT,
  dpa_version TEXT,
  ip_address TEXT,
  user_agent TEXT,
  region_detected TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_types JSONB DEFAULT '{"essential": true, "functional": false, "analytics": false, "marketing": false}'::jsonb
);

-- Enable RLS
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances" 
ON public.terms_acceptances 
FOR SELECT 
USING (auth.uid() = user_id);

-- Anyone can insert (for signup flow before auth)
CREATE POLICY "Anyone can insert acceptances" 
ON public.terms_acceptances 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_terms_acceptances_user_id ON public.terms_acceptances(user_id);
CREATE INDEX idx_terms_acceptances_accepted_at ON public.terms_acceptances(accepted_at DESC);