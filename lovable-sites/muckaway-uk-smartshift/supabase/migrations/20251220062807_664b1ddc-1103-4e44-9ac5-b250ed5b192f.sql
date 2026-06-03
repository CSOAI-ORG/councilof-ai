-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create enum for licence tiers
CREATE TYPE public.licence_tier AS ENUM ('upper', 'lower');

-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('valid', 'expired', 'suspended', 'not_found', 'pending');

-- Create enum for activity status
CREATE TYPE public.activity_status AS ENUM ('pending_review', 'dismissed', 'confirmed_fraud', 'under_investigation');

-- Table: licence_verifications - Track all licence verification attempts
CREATE TABLE public.licence_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  licence_number TEXT NOT NULL,
  licence_tier licence_tier,
  registered_holder TEXT,
  expiry_date DATE,
  verification_status verification_status DEFAULT 'pending',
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: waste_carrier_licences - Link verified licences to customers
CREATE TABLE public.waste_carrier_licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  licence_number TEXT NOT NULL,
  licence_tier licence_tier NOT NULL,
  registered_holder TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  verification_id UUID REFERENCES public.licence_verifications(id),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, licence_number)
);

-- Table: customer_risk_assessments - Store customer risk scores
CREATE TABLE public.customer_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100) DEFAULT 0,
  risk_level risk_level DEFAULT 'low',
  flagged_reasons TEXT[] DEFAULT '{}',
  assessment_notes TEXT,
  last_assessment_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  manual_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  override_by UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: suspicious_activity_log - Log fraud indicators
CREATE TABLE public.suspicious_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  severity risk_level DEFAULT 'medium',
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status activity_status DEFAULT 'pending_review',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: data_access_audit - PII access trail
CREATE TABLE public.data_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.licence_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_carrier_licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licence_verifications
CREATE POLICY "Users can manage own licence verifications"
ON public.licence_verifications FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for waste_carrier_licences
CREATE POLICY "Users can manage own waste carrier licences"
ON public.waste_carrier_licences FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for customer_risk_assessments
CREATE POLICY "Users can manage own risk assessments"
ON public.customer_risk_assessments FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for suspicious_activity_log
CREATE POLICY "Users can view own suspicious activity logs"
ON public.suspicious_activity_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create suspicious activity logs"
ON public.suspicious_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suspicious activity logs"
ON public.suspicious_activity_log FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for data_access_audit
CREATE POLICY "Users can view own audit logs"
ON public.data_access_audit FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.data_access_audit FOR INSERT
WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.data_access_audit FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_licence_verifications_licence_number ON public.licence_verifications(licence_number);
CREATE INDEX idx_licence_verifications_status ON public.licence_verifications(verification_status);
CREATE INDEX idx_waste_carrier_licences_customer ON public.waste_carrier_licences(customer_id);
CREATE INDEX idx_waste_carrier_licences_expiry ON public.waste_carrier_licences(expiry_date);
CREATE INDEX idx_customer_risk_assessments_customer ON public.customer_risk_assessments(customer_id);
CREATE INDEX idx_customer_risk_assessments_level ON public.customer_risk_assessments(risk_level);
CREATE INDEX idx_suspicious_activity_customer ON public.suspicious_activity_log(customer_id);
CREATE INDEX idx_suspicious_activity_status ON public.suspicious_activity_log(status);
CREATE INDEX idx_data_access_audit_user ON public.data_access_audit(user_id);
CREATE INDEX idx_data_access_audit_resource ON public.data_access_audit(resource_type, resource_id);

-- Add triggers for updated_at
CREATE TRIGGER update_licence_verifications_updated_at
BEFORE UPDATE ON public.licence_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waste_carrier_licences_updated_at
BEFORE UPDATE ON public.waste_carrier_licences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_risk_assessments_updated_at
BEFORE UPDATE ON public.customer_risk_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();