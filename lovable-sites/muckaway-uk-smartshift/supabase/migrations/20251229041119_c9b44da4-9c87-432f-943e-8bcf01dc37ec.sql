-- Create leads table for capturing form submissions
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  source_page TEXT,
  lead_type TEXT NOT NULL DEFAULT 'general', -- 'quote', 'newsletter', 'lead_magnet', 'exit_intent'
  quote_data JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  user_id UUID -- linked if they sign up
);

-- Create index for efficient querying
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_source_page ON public.leads(source_page);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit leads (public form submissions)
CREATE POLICY "Anyone can submit leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Policy: Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update leads
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();