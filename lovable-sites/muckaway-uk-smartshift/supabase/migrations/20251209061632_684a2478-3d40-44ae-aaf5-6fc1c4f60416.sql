-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  licence_number TEXT,
  licence_expiry DATE,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  vehicle_type TEXT,
  capacity_tonnes NUMERIC(10,2),
  mot_expiry DATE,
  last_service DATE,
  next_service_due DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  postcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  access_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create customer_portal_access table
CREATE TABLE public.customer_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add customer_id and site_id to jobs table
ALTER TABLE public.jobs ADD COLUMN customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.jobs ADD COLUMN site_id UUID REFERENCES public.sites(id);
ALTER TABLE public.jobs ADD COLUMN spoil_type TEXT;
ALTER TABLE public.jobs ADD COLUMN estimated_tonnage NUMERIC(10,2);
ALTER TABLE public.jobs ADD COLUMN quote_amount NUMERIC(10,2);
ALTER TABLE public.jobs ADD COLUMN driver_id UUID REFERENCES public.drivers(id);
ALTER TABLE public.jobs ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "Users can view own drivers" ON public.drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create drivers" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drivers" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drivers" ON public.drivers FOR DELETE USING (auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Customers policies
CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Sites policies
CREATE POLICY "Users can view sites" ON public.sites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = sites.customer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create sites" ON public.sites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update sites" ON public.sites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = sites.customer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete sites" ON public.sites FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = sites.customer_id AND user_id = auth.uid())
);

-- Customer portal access policies
CREATE POLICY "Users can view portal access" ON public.customer_portal_access FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_portal_access.customer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create portal access" ON public.customer_portal_access FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update portal access" ON public.customer_portal_access FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_portal_access.customer_id AND user_id = auth.uid())
);

-- Add updated_at triggers
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();