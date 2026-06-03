
-- Phase 9: Customer Credit Management
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_terms_days INTEGER DEFAULT 30;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net30';

CREATE TABLE public.customer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invoice', 'payment', 'credit_note', 'adjustment')),
  amount NUMERIC NOT NULL,
  running_balance NUMERIC,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customer transactions" ON public.customer_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Phase 10: Gantt Scheduler
CREATE TABLE public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  block_type TEXT DEFAULT 'job' CHECK (block_type IN ('job', 'break', 'maintenance', 'unavailable')),
  notes TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedule blocks" ON public.schedule_blocks
  FOR ALL USING (auth.uid() = user_id);

-- Phase 11: Subcontractor Management
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  waste_carrier_licence TEXT,
  licence_expiry DATE,
  rate_per_tonne NUMERIC,
  rate_per_hour NUMERIC,
  service_types TEXT[],
  regions_covered TEXT[],
  active BOOLEAN DEFAULT true,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subcontractors" ON public.subcontractors
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.subcontractor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  quoted_rate NUMERIC,
  agreed_rate NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed')),
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.subcontractor_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subcontractor jobs" ON public.subcontractor_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Phase 8: GPS Live Tracking
CREATE TABLE public.vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vehicle locations" ON public.vehicle_locations
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_locations;

CREATE TABLE public.route_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  plan_date DATE NOT NULL,
  optimized_route JSONB,
  total_distance_km NUMERIC,
  estimated_duration_mins INTEGER,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.route_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own route plans" ON public.route_plans
  FOR ALL USING (auth.uid() = user_id);

-- Phase 12: Environmental Reports
CREATE TABLE public.environmental_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('co2_saved', 'recycled_tonnage', 'landfill_diverted', 'transport_emissions')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  methodology TEXT
);

ALTER TABLE public.environmental_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own environmental metrics" ON public.environmental_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.sustainability_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_tonnage NUMERIC,
  recycled_tonnage NUMERIC,
  landfill_tonnage NUMERIC,
  co2_saved_kg NUMERIC,
  recycling_rate_percent NUMERIC,
  report_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sustainability_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sustainability reports" ON public.sustainability_reports
  FOR ALL USING (auth.uid() = user_id);

-- Phase 7: Accounting Integration
CREATE TABLE public.accounting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'sage', 'freshbooks')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  company_id TEXT,
  company_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

ALTER TABLE public.accounting_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounting connections" ON public.accounting_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.invoice_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  accounting_connection_id UUID REFERENCES public.accounting_connections(id) ON DELETE CASCADE,
  external_invoice_id TEXT,
  external_invoice_number TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed', 'paid')),
  synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoice syncs" ON public.invoice_syncs
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vehicle_locations_vehicle_id ON public.vehicle_locations(vehicle_id);
CREATE INDEX idx_vehicle_locations_recorded_at ON public.vehicle_locations(recorded_at DESC);
CREATE INDEX idx_customer_transactions_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX idx_schedule_blocks_date ON public.schedule_blocks(start_time, end_time);
CREATE INDEX idx_environmental_metrics_user_job ON public.environmental_metrics(user_id, job_id);
