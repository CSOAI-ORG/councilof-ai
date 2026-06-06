-- Create job_transactions table for metered billing
CREATE TABLE public.job_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.job_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own transactions"
ON public.job_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.job_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_job_transactions_user_id ON public.job_transactions(user_id);
CREATE INDEX idx_job_transactions_status ON public.job_transactions(status);
CREATE INDEX idx_job_transactions_created_at ON public.job_transactions(created_at);