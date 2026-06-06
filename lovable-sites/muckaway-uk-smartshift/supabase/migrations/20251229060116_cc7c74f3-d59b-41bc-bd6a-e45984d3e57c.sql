-- Create visual test notification recipients table
CREATE TABLE public.visual_test_notification_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on email
ALTER TABLE public.visual_test_notification_recipients 
ADD CONSTRAINT visual_test_notification_recipients_email_unique UNIQUE (email);

-- Enable RLS
ALTER TABLE public.visual_test_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification recipients
CREATE POLICY "Admins can manage visual test notification recipients"
ON public.visual_test_notification_recipients
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_visual_test_notification_recipients_updated_at
BEFORE UPDATE ON public.visual_test_notification_recipients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add visual test alert preference to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_visual_test_alerts BOOLEAN DEFAULT false;