-- Create visual test baselines table
CREATE TABLE public.visual_test_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_path TEXT NOT NULL,
  viewport TEXT NOT NULL DEFAULT 'desktop',
  screenshot_url TEXT,
  screenshot_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(route_path, viewport)
);

-- Create visual test results table
CREATE TABLE public.visual_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_run_id UUID NOT NULL,
  route_path TEXT NOT NULL,
  viewport TEXT NOT NULL DEFAULT 'desktop',
  status TEXT NOT NULL DEFAULT 'pending',
  baseline_id UUID REFERENCES public.visual_test_baselines(id),
  current_screenshot_data TEXT,
  diff_screenshot_data TEXT,
  pixel_diff_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  load_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id)
);

-- Create visual test runs table for grouping results
CREATE TABLE public.visual_test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_tests INTEGER DEFAULT 0,
  passed_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  new_tests INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.visual_test_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_test_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for baselines
CREATE POLICY "Authenticated users can view baselines"
ON public.visual_test_baselines FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert baselines"
ON public.visual_test_baselines FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update baselines"
ON public.visual_test_baselines FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete baselines"
ON public.visual_test_baselines FOR DELETE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for results
CREATE POLICY "Authenticated users can view results"
ON public.visual_test_results FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert results"
ON public.visual_test_results FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update results"
ON public.visual_test_results FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for test runs
CREATE POLICY "Authenticated users can view test runs"
ON public.visual_test_runs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert test runs"
ON public.visual_test_runs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update test runs"
ON public.visual_test_runs FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX idx_visual_test_baselines_route ON public.visual_test_baselines(route_path);
CREATE INDEX idx_visual_test_results_run ON public.visual_test_results(test_run_id);
CREATE INDEX idx_visual_test_results_status ON public.visual_test_results(status);