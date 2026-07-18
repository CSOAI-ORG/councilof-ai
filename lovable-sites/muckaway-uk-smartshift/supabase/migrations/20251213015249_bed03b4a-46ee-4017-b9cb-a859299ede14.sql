-- Analytics events table for intelligent data harvesting
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI feedback table for reinforcement learning
CREATE TABLE public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES public.ai_interactions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'correction', 'accepted', 'rejected')),
  feedback_value TEXT,
  original_response TEXT,
  corrected_response TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI learning patterns table (aggregated, anonymized)
CREATE TABLE public.ai_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  pattern_key TEXT NOT NULL,
  pattern_value JSONB NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  success_rate NUMERIC(5,4) DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pattern_type, pattern_key)
);

-- User segments table for behavioral analysis
CREATE TABLE public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  segment_type TEXT NOT NULL,
  segment_value TEXT NOT NULL,
  confidence_score NUMERIC(5,4) DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, segment_type)
);

-- Conversation sessions for AI memory
CREATE TABLE public.ai_conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  context JSONB DEFAULT '{}',
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outcome tracking for RL
CREATE TABLE public.ai_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES public.ai_interactions(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('quote_generated', 'quote_accepted', 'job_created', 'job_completed', 'payment_received', 'repeat_customer')),
  outcome_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events (insert only for users, select for admins)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own analytics" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for ai_feedback
CREATE POLICY "Users can create feedback" ON public.ai_feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own feedback" ON public.ai_feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for ai_learning_patterns (admin only for now, service role for writes)
CREATE POLICY "Admins can view patterns" ON public.ai_learning_patterns FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_segments
CREATE POLICY "Users can view own segments" ON public.user_segments FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for ai_conversation_sessions
CREATE POLICY "Users can manage own sessions" ON public.ai_conversation_sessions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for ai_outcomes
CREATE POLICY "Users can view own outcomes" ON public.ai_outcomes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_interactions WHERE id = ai_outcomes.interaction_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.quotes WHERE id = ai_outcomes.quote_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.jobs WHERE id = ai_outcomes.job_id AND user_id = auth.uid())
);
CREATE POLICY "System can create outcomes" ON public.ai_outcomes FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_session ON public.analytics_events(user_id, session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_ai_feedback_interaction ON public.ai_feedback(interaction_id);
CREATE INDEX idx_ai_learning_patterns_type ON public.ai_learning_patterns(pattern_type);
CREATE INDEX idx_ai_conversation_sessions_user ON public.ai_conversation_sessions(user_id, last_activity DESC);
CREATE INDEX idx_ai_outcomes_interaction ON public.ai_outcomes(interaction_id);
CREATE INDEX idx_ai_outcomes_type ON public.ai_outcomes(outcome_type, created_at DESC);