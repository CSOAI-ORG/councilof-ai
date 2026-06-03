-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'operator_admin', 'driver', 'customer', 'dispatcher');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create vehicle tracking table for GPS
CREATE TABLE public.vehicle_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    driver_id UUID REFERENCES drivers(id)
);

-- Create orders table for payments
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    stripe_session_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'gbp',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics events table
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance schedules table
CREATE TABLE public.maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    cost DECIMAL(10, 2),
    notes TEXT,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('vehicle-images', 'vehicle-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Enable RLS on new tables
ALTER TABLE public.vehicle_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for vehicle_tracking
CREATE POLICY "Drivers can view their vehicle tracking" ON public.vehicle_tracking
FOR SELECT USING (driver_id IN (
    SELECT id FROM drivers WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Operator admins can view all tracking" ON public.vehicle_tracking
FOR ALL USING (public.has_role(auth.uid(), 'operator_admin') OR public.has_role(auth.uid(), 'admin'));

-- RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Orders can be inserted" ON public.orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders can be updated" ON public.orders
FOR UPDATE USING (true);

-- RLS policies for analytics_events
CREATE POLICY "Users can insert their own events" ON public.analytics_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator_admin'));

-- RLS policies for maintenance_schedules
CREATE POLICY "Operator admins can manage maintenance" ON public.maintenance_schedules
FOR ALL USING (public.has_role(auth.uid(), 'operator_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view vehicle maintenance" ON public.maintenance_schedules
FOR SELECT USING (vehicle_id IN (
    SELECT vehicle_id FROM job_assignments WHERE driver_id IN (
        SELECT id FROM drivers WHERE profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
));

-- Storage policies for documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for vehicle images
CREATE POLICY "Vehicle images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Operator admins can upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'vehicle-images' AND (public.has_role(auth.uid(), 'operator_admin') OR public.has_role(auth.uid(), 'admin')));

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
    BEFORE UPDATE ON public.maintenance_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();