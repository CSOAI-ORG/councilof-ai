-- Usage Records Table for metering
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  jobs_count INTEGER DEFAULT 0,
  ai_requests_count INTEGER DEFAULT 0,
  storage_bytes_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.usage_records
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert/update usage (via service role)
CREATE POLICY "Service can manage usage"
ON public.usage_records
FOR ALL
USING (true)
WITH CHECK (true);

-- Email Logs Table
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
ON public.email_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert email logs
CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_usage_records_user_period ON public.usage_records(user_id, period_start);
CREATE INDEX idx_email_logs_user ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type);

-- Trigger for updated_at on usage_records
CREATE TRIGGER update_usage_records_updated_at
BEFORE UPDATE ON public.usage_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();