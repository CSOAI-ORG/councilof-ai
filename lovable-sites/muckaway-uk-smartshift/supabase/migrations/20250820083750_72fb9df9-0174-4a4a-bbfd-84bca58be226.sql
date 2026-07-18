-- Create enum types for various classifications
CREATE TYPE public.spoil_type AS ENUM ('soil', 'clay', 'chalk', 'hardcore', 'mixed', 'topsoil');
CREATE TYPE public.contamination_level AS ENUM ('inert', 'standard', 'hazardous');
CREATE TYPE public.job_status AS ENUM ('quote', 'booked', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.user_role AS ENUM ('customer', 'operator_admin', 'driver', 'compliance_officer');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'customer',
  waste_carrier_licence TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  postcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  site_contact TEXT,
  site_phone TEXT,
  access_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  spoil_type spoil_type NOT NULL,
  contamination_level contamination_level NOT NULL,
  estimated_volume DECIMAL(10,2) NOT NULL,
  estimated_tonnage DECIMAL(10,2) NOT NULL,
  actual_tonnage DECIMAL(10,2),
  ewc_code TEXT,
  quote_amount DECIMAL(10,2) NOT NULL,
  haulage_cost DECIMAL(10,2) NOT NULL,
  disposal_cost DECIMAL(10,2) NOT NULL,
  landfill_tax DECIMAL(10,2) NOT NULL,
  status job_status DEFAULT 'quote',
  scheduled_date DATE,
  completed_date DATE,
  wtn_number TEXT,
  consignment_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  capacity_tonnes DECIMAL(5,2),
  mot_expiry DATE,
  last_service DATE,
  next_service_due DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  licence_number TEXT NOT NULL,
  licence_expiry DATE,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job assignments table
CREATE TABLE public.job_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_date TIMESTAMP WITH TIME ZONE,
  weighbridge_ticket_url TEXT,
  actual_weight DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disposal sites table
CREATE TABLE public.disposal_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  licence_number TEXT,
  accepts_inert BOOLEAN DEFAULT true,
  accepts_hazardous BOOLEAN DEFAULT false,
  gate_fee_inert DECIMAL(8,2),
  gate_fee_standard DECIMAL(8,2),
  gate_fee_hazardous DECIMAL(8,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposal_sites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for customers
CREATE POLICY "Users can view customers they have access to" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (profiles.role = 'operator_admin' OR profiles.id = customers.profile_id)
    )
  );

CREATE POLICY "Operator admins can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'operator_admin'
    )
  );

-- Create RLS policies for jobs
CREATE POLICY "Users can view relevant jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (
        profiles.role = 'operator_admin' OR 
        profiles.role = 'driver' OR
        jobs.customer_id IN (
          SELECT id FROM public.customers WHERE profile_id = profiles.id
        )
      )
    )
  );

CREATE POLICY "Operator admins can manage jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'operator_admin'
    )
  );

-- Create disposal sites policies (public read access)
CREATE POLICY "Everyone can view active disposal sites" ON public.disposal_sites
  FOR SELECT USING (active = true);

CREATE POLICY "Operator admins can manage disposal sites" ON public.disposal_sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'operator_admin'
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, contact_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample disposal sites
INSERT INTO public.disposal_sites (name, address, postcode, licence_number, accepts_inert, accepts_hazardous, gate_fee_inert, gate_fee_standard) VALUES
('Thames Valley Landfill', 'Colnbrook Road, Slough', 'SL3 0HJ', 'EPR/AB1234CD', true, false, 25.00, 45.00),
('London Clay Recycling Centre', 'Industrial Estate, Dagenham', 'RM9 6RH', 'EPR/EF5678GH', true, false, 20.00, 40.00),
('Kent Waste Management', 'Dover Road, Canterbury', 'CT1 3HD', 'EPR/IJ9012KL', true, true, 30.00, 50.00);