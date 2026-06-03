-- Enable Row Level Security on the drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the drivers table

-- Policy 1: Operator admins can manage all driver records
CREATE POLICY "Operator admins can manage all drivers" 
ON public.drivers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'operator_admin'
  )
);

-- Policy 2: Drivers can view and update their own profile
CREATE POLICY "Drivers can view and update their own profile" 
ON public.drivers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = drivers.profile_id
  )
);

-- Policy 3: Allow viewing driver names for job assignment purposes (restricted view)
CREATE POLICY "Allow viewing driver names for job assignments" 
ON public.drivers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('operator_admin', 'driver')
  )
);

-- Additional security: Create a view for limited driver information
CREATE OR REPLACE VIEW public.drivers_public AS
SELECT 
  id,
  name,
  active
FROM public.drivers
WHERE active = true;

-- Enable RLS on the view
ALTER VIEW public.drivers_public SET (security_invoker = on);