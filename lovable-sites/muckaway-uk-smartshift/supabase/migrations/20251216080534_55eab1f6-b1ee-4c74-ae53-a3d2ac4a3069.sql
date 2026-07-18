-- Phase 15: Advanced Reporting
CREATE TABLE public.report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  email_recipients TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID REFERENCES public.report_schedules(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  format TEXT NOT NULL DEFAULT 'pdf',
  file_url TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 16: Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_job_updates BOOLEAN DEFAULT true,
  email_payment_updates BOOLEAN DEFAULT true,
  email_compliance_alerts BOOLEAN DEFAULT true,
  email_usage_warnings BOOLEAN DEFAULT true,
  inapp_job_updates BOOLEAN DEFAULT true,
  inapp_payment_updates BOOLEAN DEFAULT true,
  inapp_compliance_alerts BOOLEAN DEFAULT true,
  inapp_usage_warnings BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 18: API & Webhooks
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own report schedules" ON public.report_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own generated reports" ON public.generated_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own API keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own webhooks" ON public.webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.webhooks WHERE webhooks.id = webhook_logs.webhook_id AND webhooks.user_id = auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;