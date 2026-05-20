-- Ensure webhook_logs table exists
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_id TEXT,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    gateway_provider TEXT DEFAULT 'abacatepay',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_logs' AND policyname = 'Users can view their own webhook logs'
    ) THEN
        CREATE POLICY "Users can view their own webhook logs"
        ON public.webhook_logs FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;