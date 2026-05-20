-- Alter tables to add external IDs and gateway provider
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS external_customer_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_provider TEXT DEFAULT 'abacatepay';

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS external_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_provider TEXT DEFAULT 'abacatepay';

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_provider TEXT DEFAULT 'abacatepay';

-- Create index for faster lookups during webhooks
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON public.customers(external_customer_id, gateway_provider);
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON public.subscriptions(external_subscription_id, gateway_provider);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_payment_id, gateway_provider);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processed, error, duplicated
    error_message TEXT,
    gateway_provider TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_logs
CREATE POLICY "Users can view their own webhook logs"
ON public.webhook_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Note: Insert policy for Edge Function is not needed if using service_role,
-- but if we want to be safe and the edge function uses the user's token (not likely for webhooks)
-- For webhooks, we usually use service_role to bypass RLS or handle auth manually.
