-- Create table for SaaS Subscriptions
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    plan_name TEXT NOT NULL, -- starter, pro, premium, trial
    status TEXT NOT NULL DEFAULT 'trial', -- active, trial, expired, canceled, pending
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    external_subscription_id TEXT,
    gateway_provider TEXT DEFAULT 'abacatepay',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saas subscription"
ON public.saas_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Note: We'll allow the edge function (service_role) to handle inserts/updates.

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_saas_subs_user ON public.saas_subscriptions(user_id);

-- Add trial to existing users (optional but good for onboarding)
-- This query would be run by the system, but here we define the structure first.
