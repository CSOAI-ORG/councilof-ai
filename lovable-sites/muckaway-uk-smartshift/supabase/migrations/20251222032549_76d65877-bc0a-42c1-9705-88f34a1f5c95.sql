-- Strengthen RLS policies for quotes table (anonymous quote submission with rate limiting consideration)
-- Add validation to prevent abuse of anonymous quote submissions
CREATE OR REPLACE FUNCTION public.validate_quote_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure volume is reasonable (prevent spam with unrealistic values)
  IF NEW.volume_tonnes < 0.1 OR NEW.volume_tonnes > 100000 THEN
    RAISE EXCEPTION 'Volume must be between 0.1 and 100,000 tonnes';
  END IF;
  
  -- Ensure material type is not empty
  IF NEW.material_type IS NULL OR trim(NEW.material_type) = '' THEN
    RAISE EXCEPTION 'Material type is required';
  END IF;
  
  -- Set retention expiry for GDPR compliance (6 months for unconverted quotes)
  IF NEW.retention_expires_at IS NULL THEN
    NEW.retention_expires_at := now() + interval '6 months';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for quote validation
DROP TRIGGER IF EXISTS validate_quote_before_insert ON public.quotes;
CREATE TRIGGER validate_quote_before_insert
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_quote_insert();

-- Strengthen analytics_events insert validation
CREATE OR REPLACE FUNCTION public.validate_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate event name is reasonable length
  IF length(NEW.event_name) > 100 THEN
    RAISE EXCEPTION 'Event name too long';
  END IF;
  
  -- Validate session_id format (should be UUID-like)
  IF length(NEW.session_id) > 64 THEN
    RAISE EXCEPTION 'Invalid session ID format';
  END IF;
  
  -- Validate event_type is reasonable
  IF length(NEW.event_type) > 50 THEN
    RAISE EXCEPTION 'Event type too long';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for analytics validation
DROP TRIGGER IF EXISTS validate_analytics_before_insert ON public.analytics_events;
CREATE TRIGGER validate_analytics_before_insert
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_analytics_event();

-- Add index to improve quote lookup performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id) WHERE user_id IS NOT NULL;

-- Add index for analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_session_created ON public.analytics_events(session_id, created_at DESC);