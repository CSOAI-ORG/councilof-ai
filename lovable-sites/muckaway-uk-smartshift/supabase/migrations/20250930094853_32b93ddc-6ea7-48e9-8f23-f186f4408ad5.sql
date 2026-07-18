-- Update handle_new_user function to also create customer record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, contact_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  );
  
  -- Insert into customers table for customer role users
  INSERT INTO public.customers (
    profile_id,
    company_name,
    contact_name,
    email,
    phone
  )
  SELECT 
    p.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Individual Customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  FROM public.profiles p
  WHERE p.user_id = NEW.id;
  
  RETURN NEW;
END;
$$;