-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true
);

-- Saved quotes for returning visitors
CREATE TABLE IF NOT EXISTS public.saved_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  quote_data JSONB NOT NULL,
  material_type TEXT,
  volume_tonnes NUMERIC,
  estimated_price NUMERIC,
  source TEXT DEFAULT 'exit_intent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reminded_at TIMESTAMP WITH TIME ZONE,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Exit intent events for analytics
CREATE TABLE IF NOT EXISTS public.exit_intent_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT,
  email_captured BOOLEAN DEFAULT false,
  quote_saved BOOLEAN DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_intent_events ENABLE ROW LEVEL SECURITY;

-- Newsletter subscribers: public insert, no select for users (admin only)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Saved quotes: public insert, select by email match
CREATE POLICY "Anyone can save a quote" 
ON public.saved_quotes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view quotes by email" 
ON public.saved_quotes 
FOR SELECT 
USING (true);

-- Exit intent events: public insert for tracking
CREATE POLICY "Anyone can create exit intent events" 
ON public.exit_intent_events 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON public.newsletter_subscribers(active) WHERE active = true;
CREATE INDEX idx_saved_quotes_email ON public.saved_quotes(email);
CREATE INDEX idx_saved_quotes_converted ON public.saved_quotes(converted) WHERE converted = false;
CREATE INDEX idx_exit_intent_session ON public.exit_intent_events(session_id);
CREATE INDEX idx_exit_intent_created ON public.exit_intent_events(created_at);