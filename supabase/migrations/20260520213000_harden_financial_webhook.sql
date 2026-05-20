-- Critical financial hardening for Precifika.
-- Aligns subscription schema, enforces webhook/payment idempotency, and limits financial RLS writes.

-- Normalize subscriptions to the contract used by the app/webhook/types.ts:
-- amount, current_period_start, current_period_end, cancel_at_period_end.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'price'
  ) THEN
    EXECUTE 'UPDATE public.subscriptions SET amount = COALESCE(amount, price, 0) WHERE amount IS NULL';
  ELSE
    UPDATE public.subscriptions SET amount = COALESCE(amount, 0) WHERE amount IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'started_at'
  ) THEN
    EXECUTE 'UPDATE public.subscriptions SET current_period_start = COALESCE(current_period_start, started_at, created_at, now()) WHERE current_period_start IS NULL';
  ELSE
    UPDATE public.subscriptions
    SET current_period_start = COALESCE(current_period_start, created_at, now())
    WHERE current_period_start IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'expires_at'
  ) THEN
    EXECUTE 'UPDATE public.subscriptions SET current_period_end = COALESCE(current_period_end, expires_at, current_period_start + interval ''1 month'') WHERE current_period_end IS NULL';
  ELSE
    UPDATE public.subscriptions
    SET current_period_end = COALESCE(current_period_end, current_period_start + interval '1 month')
    WHERE current_period_end IS NULL;
  END IF;
END $$;

UPDATE public.subscriptions SET status = COALESCE(status, 'active') WHERE status IS NULL;
UPDATE public.subscriptions SET plan_name = COALESCE(plan_name, 'Assinatura AbacatePay') WHERE plan_name IS NULL;
UPDATE public.subscriptions
SET gateway_provider = COALESCE(gateway_provider, 'abacatepay')
WHERE gateway_provider IS NULL;
UPDATE public.subscriptions
SET cancel_at_period_end = COALESCE(cancel_at_period_end, false)
WHERE cancel_at_period_end IS NULL;

ALTER TABLE public.subscriptions ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE public.subscriptions ALTER COLUMN current_period_start SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN current_period_start SET DEFAULT now();
ALTER TABLE public.subscriptions ALTER COLUMN current_period_end SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN plan_name SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN gateway_provider SET DEFAULT 'abacatepay';
ALTER TABLE public.subscriptions ALTER COLUMN gateway_provider SET NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN cancel_at_period_end SET DEFAULT false;
ALTER TABLE public.subscriptions ALTER COLUMN cancel_at_period_end SET NOT NULL;

ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS price;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS billing_period;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS started_at;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS expires_at;

-- Normalize gateway columns used by idempotency keys.
UPDATE public.customers
SET gateway_provider = COALESCE(gateway_provider, 'abacatepay')
WHERE gateway_provider IS NULL;
ALTER TABLE public.customers ALTER COLUMN gateway_provider SET DEFAULT 'abacatepay';
ALTER TABLE public.customers ALTER COLUMN gateway_provider SET NOT NULL;

UPDATE public.payments
SET gateway_provider = COALESCE(gateway_provider, 'abacatepay')
WHERE gateway_provider IS NULL;
ALTER TABLE public.payments ALTER COLUMN gateway_provider SET DEFAULT 'abacatepay';
ALTER TABLE public.payments ALTER COLUMN gateway_provider SET NOT NULL;

UPDATE public.saas_subscriptions
SET gateway_provider = COALESCE(gateway_provider, 'abacatepay')
WHERE gateway_provider IS NULL;
ALTER TABLE public.saas_subscriptions ALTER COLUMN gateway_provider SET DEFAULT 'abacatepay';
ALTER TABLE public.saas_subscriptions ALTER COLUMN gateway_provider SET NOT NULL;

ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 0;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS last_duplicate_at TIMESTAMP WITH TIME ZONE;
UPDATE public.webhook_logs
SET
  gateway_provider = COALESCE(gateway_provider, 'abacatepay'),
  event_id = COALESCE(event_id, id::text),
  payload = COALESCE(payload, '{}'::jsonb),
  duplicate_count = COALESCE(duplicate_count, 0);
ALTER TABLE public.webhook_logs ALTER COLUMN gateway_provider SET DEFAULT 'abacatepay';
ALTER TABLE public.webhook_logs ALTER COLUMN gateway_provider SET NOT NULL;
ALTER TABLE public.webhook_logs ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE public.webhook_logs ALTER COLUMN payload SET DEFAULT '{}'::jsonb;
ALTER TABLE public.webhook_logs ALTER COLUMN payload SET NOT NULL;
ALTER TABLE public.webhook_logs ALTER COLUMN duplicate_count SET DEFAULT 0;
ALTER TABLE public.webhook_logs ALTER COLUMN duplicate_count SET NOT NULL;

-- Resolve historical duplicates before adding unique constraints.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, email
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.customers
)
UPDATE public.customers AS c
SET email = c.email || '+duplicate-' || c.id::text
FROM ranked
WHERE c.id = ranked.id
  AND ranked.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.saas_subscriptions
)
DELETE FROM public.saas_subscriptions AS s
USING ranked
WHERE s.id = ranked.id
  AND ranked.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY external_subscription_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.subscriptions
  WHERE external_subscription_id IS NOT NULL
)
UPDATE public.subscriptions AS s
SET external_subscription_id = s.external_subscription_id || ':duplicate:' || s.id::text
FROM ranked
WHERE s.id = ranked.id
  AND ranked.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY gateway_provider, external_payment_id
      ORDER BY paid_at DESC NULLS LAST, created_at DESC, id DESC
    ) AS rn
  FROM public.payments
  WHERE external_payment_id IS NOT NULL
)
UPDATE public.payments AS p
SET external_payment_id = p.external_payment_id || ':duplicate:' || p.id::text
FROM ranked
WHERE p.id = ranked.id
  AND ranked.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY gateway_provider, event_id
      ORDER BY processed_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.webhook_logs
)
UPDATE public.webhook_logs AS w
SET event_id = w.event_id || ':duplicate:' || w.id::text
FROM ranked
WHERE w.id = ranked.id
  AND ranked.rn > 1;

-- Unique constraints required by webhook/app upserts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_email_key'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_user_id_email_key UNIQUE (user_id, email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_external_subscription_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_external_subscription_id_key UNIQUE (external_subscription_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saas_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.saas_subscriptions
      ADD CONSTRAINT saas_subscriptions_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_logs_gateway_provider_event_id_key'
  ) THEN
    ALTER TABLE public.webhook_logs
      ADD CONSTRAINT webhook_logs_gateway_provider_event_id_key UNIQUE (gateway_provider, event_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_gateway_provider_external_payment_id_key'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_gateway_provider_external_payment_id_key UNIQUE (gateway_provider, external_payment_id);
  END IF;
END $$;

-- Financial RLS: authenticated users can read their records, but writes are service-role only.
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);
