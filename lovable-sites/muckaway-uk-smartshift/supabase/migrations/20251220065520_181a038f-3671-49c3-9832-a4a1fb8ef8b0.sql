-- Create enum for request types
CREATE TYPE public.data_request_type AS ENUM ('subject_access', 'deletion', 'portability', 'rectification', 'restriction');

-- Create enum for request status
CREATE TYPE public.data_request_status AS ENUM ('pending', 'processing', 'completed', 'rejected', 'expired');

-- Create enum for retention actions
CREATE TYPE public.retention_action AS ENUM ('archive', 'anonymize', 'delete');

-- Create data retention policies table
CREATE TABLE public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_years INTEGER NOT NULL DEFAULT 7,
  retention_action retention_action NOT NULL DEFAULT 'archive',
  legal_basis TEXT NOT NULL,
  applies_to_region TEXT DEFAULT 'all',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(table_name, applies_to_region)
);

-- Create archived records table
CREATE TABLE public.archived_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_table TEXT NOT NULL,
  original_id UUID NOT NULL,
  archived_data JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  archived_by UUID REFERENCES auth.users(id),
  retention_expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  anonymized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data subject requests table
CREATE TABLE public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type data_request_type NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  description TEXT,
  status data_request_status DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  exported_data_url TEXT,
  export_expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  cooling_off_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add retention columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add retention columns to hazardous_consignment_notes table
ALTER TABLE public.hazardous_consignment_notes 
ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add retention columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add retention columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- RLS for data_retention_policies (admins only for write, authenticated for read)
CREATE POLICY "Authenticated users can view retention policies"
ON public.data_retention_policies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage retention policies"
ON public.data_retention_policies FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for archived_records (admins only)
CREATE POLICY "Admins can view archived records"
ON public.archived_records FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert archived records"
ON public.archived_records FOR INSERT
WITH CHECK (true);

-- RLS for data_subject_requests
CREATE POLICY "Users can create data subject requests"
ON public.data_subject_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own requests"
ON public.data_subject_requests FOR SELECT
USING (requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
ON public.data_subject_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON public.data_retention_policies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_subject_requests_updated_at
BEFORE UPDATE ON public.data_subject_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_jobs_retention_expires ON public.jobs(retention_expires_at) WHERE retention_expires_at IS NOT NULL;
CREATE INDEX idx_jobs_anonymized ON public.jobs(anonymized) WHERE anonymized = false;
CREATE INDEX idx_archived_records_original ON public.archived_records(original_table, original_id);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_email ON public.data_subject_requests(requester_email);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_years, retention_action, legal_basis, description) VALUES
('jobs', 7, 'archive', 'Tax regulations and EA waste duty of care (7 years)', 'Waste Transfer Notes and job records'),
('hazardous_consignment_notes', 10, 'archive', 'HSE regulations (10 years for hazardous waste)', 'Hazardous waste consignment notes'),
('customers', 7, 'anonymize', 'Contract and legitimate interest (7 years after last activity)', 'Customer personal data'),
('quotes', 2, 'delete', 'Contract (2 years if not converted)', 'Unconverted quotes'),
('ai_interactions', 2, 'delete', 'Legitimate interest (2 years)', 'AI chatbot conversation history'),
('analytics_events', 2, 'anonymize', 'Consent (26 months)', 'Website analytics and usage data');