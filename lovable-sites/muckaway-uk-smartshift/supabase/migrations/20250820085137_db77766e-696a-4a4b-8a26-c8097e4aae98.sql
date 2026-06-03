-- Create hazardous consignment notes table
CREATE TABLE public.hazardous_consignment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  consignment_number TEXT NOT NULL UNIQUE,
  producer_name TEXT NOT NULL,
  producer_address TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  carrier_licence TEXT NOT NULL,
  waste_description TEXT NOT NULL,
  ewc_code TEXT NOT NULL,
  physical_form TEXT NOT NULL,
  quantity_tonnes NUMERIC NOT NULL,
  container_type TEXT NOT NULL,
  hazard_codes TEXT[],
  special_handling_requirements TEXT,
  destination_site_name TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_permit TEXT NOT NULL,
  section_a_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  section_b_signature TEXT,
  section_b_date TIMESTAMP WITH TIME ZONE,
  section_c_signature TEXT,
  section_c_date TIMESTAMP WITH TIME ZONE,
  section_d_signature TEXT,
  section_d_date TIMESTAMP WITH TIME ZONE,
  section_e_signature TEXT,
  section_e_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver daily checks table
CREATE TABLE public.driver_daily_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT current_date,
  lights_working BOOLEAN NOT NULL DEFAULT false,
  tyres_condition BOOLEAN NOT NULL DEFAULT false,
  brakes_working BOOLEAN NOT NULL DEFAULT false,
  mirrors_clean BOOLEAN NOT NULL DEFAULT false,
  seatbelt_working BOOLEAN NOT NULL DEFAULT false,
  horn_working BOOLEAN NOT NULL DEFAULT false,
  steering_responsive BOOLEAN NOT NULL DEFAULT false,
  fluid_levels_ok BOOLEAN NOT NULL DEFAULT false,
  load_securing_equipment BOOLEAN NOT NULL DEFAULT false,
  tailgate_operation BOOLEAN NOT NULL DEFAULT false,
  hydraulics_working BOOLEAN NOT NULL DEFAULT false,
  grab_arm_operation BOOLEAN NOT NULL DEFAULT false,
  defects_noted TEXT,
  vehicle_clean BOOLEAN NOT NULL DEFAULT false,
  odometer_reading NUMERIC,
  fuel_level NUMERIC,
  driver_signature TEXT,
  supervisor_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, vehicle_id, check_date)
);

-- Create weighbridge tickets table
CREATE TABLE public.weighbridge_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_assignment_id UUID REFERENCES public.job_assignments(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  weighbridge_name TEXT NOT NULL,
  gross_weight NUMERIC NOT NULL,
  tare_weight NUMERIC NOT NULL,
  net_weight NUMERIC NOT NULL,
  ticket_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_image_url TEXT,
  processed_by_ocr BOOLEAN DEFAULT false,
  ocr_confidence NUMERIC,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer portal access table
CREATE TABLE public.customer_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.hazardous_consignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weighbridge_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for hazardous consignment notes
CREATE POLICY "Operator admins can manage hazardous consignment notes"
ON public.hazardous_consignment_notes
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'operator_admin'
));

CREATE POLICY "Users can view relevant hazardous consignment notes"
ON public.hazardous_consignment_notes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND (
    profiles.role = 'operator_admin'
    OR profiles.role = 'driver'
    OR hazardous_consignment_notes.job_id IN (
      SELECT jobs.id FROM jobs
      JOIN customers ON jobs.customer_id = customers.id
      WHERE customers.profile_id = profiles.id
    )
  )
));

-- RLS policies for driver daily checks
CREATE POLICY "Drivers can manage their own checks"
ON public.driver_daily_checks
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  JOIN drivers ON profiles.id = drivers.profile_id
  WHERE profiles.user_id = auth.uid()
  AND drivers.id = driver_daily_checks.driver_id
));

CREATE POLICY "Operator admins can view all driver checks"
ON public.driver_daily_checks
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'operator_admin'
));

-- RLS policies for weighbridge tickets
CREATE POLICY "Operator admins can manage weighbridge tickets"
ON public.weighbridge_tickets
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'operator_admin'
));

CREATE POLICY "Drivers can view relevant weighbridge tickets"
ON public.weighbridge_tickets
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  JOIN drivers ON profiles.id = drivers.profile_id
  JOIN job_assignments ON drivers.id = job_assignments.driver_id
  WHERE profiles.user_id = auth.uid()
  AND job_assignments.id = weighbridge_tickets.job_assignment_id
));

-- RLS policies for customer portal access
CREATE POLICY "Operator admins can manage customer portal access"
ON public.customer_portal_access
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'operator_admin'
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_hazardous_consignment_notes_updated_at
  BEFORE UPDATE ON public.hazardous_consignment_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_daily_checks_updated_at
  BEFORE UPDATE ON public.driver_daily_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weighbridge_tickets_updated_at
  BEFORE UPDATE ON public.weighbridge_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_portal_access_updated_at
  BEFORE UPDATE ON public.customer_portal_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();