-- Create driver_daily_checks table
CREATE TABLE public.driver_daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lights_working BOOLEAN DEFAULT false,
  tyres_condition BOOLEAN DEFAULT false,
  brakes_working BOOLEAN DEFAULT false,
  mirrors_clean BOOLEAN DEFAULT false,
  seatbelt_working BOOLEAN DEFAULT false,
  horn_working BOOLEAN DEFAULT false,
  steering_responsive BOOLEAN DEFAULT false,
  fluid_levels_ok BOOLEAN DEFAULT false,
  load_securing_equipment BOOLEAN DEFAULT false,
  tailgate_operation BOOLEAN DEFAULT false,
  hydraulics_working BOOLEAN DEFAULT false,
  grab_arm_operation BOOLEAN DEFAULT false,
  defects_noted TEXT,
  vehicle_clean BOOLEAN DEFAULT false,
  odometer_reading NUMERIC(10,0),
  fuel_level NUMERIC(5,2),
  driver_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create job_assignments table
CREATE TABLE public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_transit', 'at_site', 'loading', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create hazardous_consignment_notes table
CREATE TABLE public.hazardous_consignment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  consignment_number TEXT NOT NULL UNIQUE,
  producer_name TEXT NOT NULL,
  producer_address TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  carrier_licence TEXT,
  waste_description TEXT NOT NULL,
  ewc_code TEXT NOT NULL,
  physical_form TEXT DEFAULT 'solid' CHECK (physical_form IN ('solid', 'liquid', 'gas', 'sludge', 'powder')),
  quantity_tonnes NUMERIC(10,2) NOT NULL,
  container_type TEXT DEFAULT 'skip' CHECK (container_type IN ('skip', 'bulk', 'drums', 'ibc', 'tanker')),
  hazard_codes TEXT[] DEFAULT '{}',
  special_handling_requirements TEXT,
  destination_site_name TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_permit TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'section_a_completed', 'section_b_completed', 'section_c_completed', 'section_d_completed', 'completed')),
  section_a_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  section_a_signature TEXT,
  section_b_date TIMESTAMP WITH TIME ZONE,
  section_b_signature TEXT,
  section_c_date TIMESTAMP WITH TIME ZONE,
  section_c_signature TEXT,
  section_d_date TIMESTAMP WITH TIME ZONE,
  section_d_signature TEXT,
  section_e_date TIMESTAMP WITH TIME ZONE,
  section_e_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create weighbridge_tickets table
CREATE TABLE public.weighbridge_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_assignment_id UUID REFERENCES public.job_assignments(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL,
  weighbridge_name TEXT NOT NULL,
  gross_weight NUMERIC(10,2) NOT NULL,
  tare_weight NUMERIC(10,2) NOT NULL,
  net_weight NUMERIC(10,2) NOT NULL,
  ticket_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_image_url TEXT,
  processed_by_ocr BOOLEAN DEFAULT false,
  ocr_confidence NUMERIC(5,2),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add scheduled_date and completed_date to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimated_volume NUMERIC(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS haulage_cost NUMERIC(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS disposal_cost NUMERIC(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS landfill_tax_amount NUMERIC(10,2);

-- Add profile_id to customers for linking
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.driver_daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazardous_consignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weighbridge_tickets ENABLE ROW LEVEL SECURITY;

-- Driver daily checks policies
CREATE POLICY "Users can view driver checks" ON public.driver_daily_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_daily_checks.driver_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create driver checks" ON public.driver_daily_checks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.drivers WHERE id = driver_id AND user_id = auth.uid())
);

-- Job assignments policies
CREATE POLICY "Users can view job assignments" ON public.job_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_assignments.job_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create job assignments" ON public.job_assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update job assignments" ON public.job_assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_assignments.job_id AND user_id = auth.uid())
);

-- Hazardous consignment notes policies
CREATE POLICY "Users can view hazardous notes" ON public.hazardous_consignment_notes FOR SELECT USING (
  job_id IS NULL OR EXISTS (SELECT 1 FROM public.jobs WHERE id = hazardous_consignment_notes.job_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create hazardous notes" ON public.hazardous_consignment_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update hazardous notes" ON public.hazardous_consignment_notes FOR UPDATE USING (
  job_id IS NULL OR EXISTS (SELECT 1 FROM public.jobs WHERE id = hazardous_consignment_notes.job_id AND user_id = auth.uid())
);

-- Weighbridge tickets policies
CREATE POLICY "Users can view weighbridge tickets" ON public.weighbridge_tickets FOR SELECT USING (
  job_assignment_id IS NULL OR EXISTS (
    SELECT 1 FROM public.job_assignments ja 
    JOIN public.jobs j ON ja.job_id = j.id 
    WHERE ja.id = weighbridge_tickets.job_assignment_id AND j.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create weighbridge tickets" ON public.weighbridge_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update weighbridge tickets" ON public.weighbridge_tickets FOR UPDATE USING (
  job_assignment_id IS NULL OR EXISTS (
    SELECT 1 FROM public.job_assignments ja 
    JOIN public.jobs j ON ja.job_id = j.id 
    WHERE ja.id = weighbridge_tickets.job_assignment_id AND j.user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_job_assignments_updated_at BEFORE UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hazardous_notes_updated_at BEFORE UPDATE ON public.hazardous_consignment_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();