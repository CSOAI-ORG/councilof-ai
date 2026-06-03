-- Fix permissive RLS INSERT policy for hazardous_consignment_notes
DROP POLICY IF EXISTS "Users can create hazardous notes" ON public.hazardous_consignment_notes;
CREATE POLICY "Users can create hazardous notes" 
ON public.hazardous_consignment_notes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix permissive RLS INSERT policy for weighbridge_tickets
DROP POLICY IF EXISTS "Users can create weighbridge tickets" ON public.weighbridge_tickets;
CREATE POLICY "Users can create weighbridge tickets" 
ON public.weighbridge_tickets 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);