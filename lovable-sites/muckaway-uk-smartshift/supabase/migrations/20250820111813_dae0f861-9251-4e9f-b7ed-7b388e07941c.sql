-- Enable Row Level Security on business operations tables
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- JOB ASSIGNMENTS RLS Policies
-- Operator admins can manage all job assignments
CREATE POLICY "Operator admins can manage job assignments" 
ON public.job_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'operator_admin'
  )
);

-- Drivers can view and update job assignments assigned to them
CREATE POLICY "Drivers can manage their own job assignments" 
ON public.job_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    JOIN public.drivers ON profiles.id = drivers.profile_id
    WHERE profiles.user_id = auth.uid() 
    AND drivers.id = job_assignments.driver_id
  )
);

-- Customers can view job assignments for their jobs
CREATE POLICY "Customers can view their job assignments" 
ON public.job_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    JOIN public.customers ON profiles.id = customers.profile_id
    JOIN public.jobs ON customers.id = jobs.customer_id
    WHERE profiles.user_id = auth.uid() 
    AND jobs.id = job_assignments.job_id
  )
);

-- SITES RLS Policies
-- Operator admins can manage all sites
CREATE POLICY "Operator admins can manage sites" 
ON public.sites 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'operator_admin'
  )
);

-- Customers can manage their own sites
CREATE POLICY "Customers can manage their own sites" 
ON public.sites 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    JOIN public.customers ON profiles.id = customers.profile_id
    WHERE profiles.user_id = auth.uid() 
    AND customers.id = sites.customer_id
  )
);

-- Drivers can view sites for jobs they're assigned to
CREATE POLICY "Drivers can view relevant sites" 
ON public.sites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    JOIN public.drivers ON profiles.id = drivers.profile_id
    JOIN public.job_assignments ON drivers.id = job_assignments.driver_id
    JOIN public.jobs ON job_assignments.job_id = jobs.id
    WHERE profiles.user_id = auth.uid() 
    AND jobs.site_id = sites.id
  )
);

-- VEHICLES RLS Policies
-- Operator admins can manage all vehicles
CREATE POLICY "Operator admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'operator_admin'
  )
);

-- Drivers can view vehicles assigned to them
CREATE POLICY "Drivers can view assigned vehicles" 
ON public.vehicles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    JOIN public.drivers ON profiles.id = drivers.profile_id
    JOIN public.job_assignments ON drivers.id = job_assignments.driver_id
    WHERE profiles.user_id = auth.uid() 
    AND job_assignments.vehicle_id = vehicles.id
  )
);

-- CUSTOMERS RLS Policies (fixing the existing gap)
-- Operator admins can manage customers
CREATE POLICY "Operator admins can manage customers" 
ON public.customers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'operator_admin'
  )
);

-- Users can view customers they have access to
CREATE POLICY "Users can view customers they have access to" 
ON public.customers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.role = 'operator_admin' 
      OR profiles.id = customers.profile_id
    )
  )
);

-- Enable RLS on the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;