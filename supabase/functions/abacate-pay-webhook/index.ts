import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_PROVIDER = "abacatepay";
const SIGNATURE_HEADERS = ["X-Webhook-Signature", "X-Abacate-Signature"];
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_HMAC_SECRET =
  Deno.env.get("ABACATEPAY_WEBHOOK_SECRET") || Deno.env.get("ABACATEPAY_PUBLIC_KEY");

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

type WebhookPayload = {
  id?: unknown;
  event?: unknown;
  data?: {
    checkout?: Record<string, unknown>;
    customer?: Record<string, unknown>;
    subscription?: Record<string, unknown>;
  };
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNestedString(source: unknown, path: string[]): string | undefined {
  let current = source;

  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return getString(current);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function centsToCurrency(value: unknown): number {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 0;
  return amount / 100;
}

function getFirstString(value: unknown): string | undefined {
  return Array.isArray(value) ? getString(value[0]) : undefined;
}

function getSignature(req: Request): string | undefined {
  for (const header of SIGNATURE_HEADERS) {
    const signature = req.headers.get(header);
    if (signature) return signature;
  }

  return undefined;
}

function oneMonthFromNow(): string {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt.toISOString();
}

function normalizeSignature(signature: string): string {
  const trimmed = signature.trim();
  return trimmed.toLowerCase().startsWith("sha256=") ? trimmed.slice(7) : trimmed;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let index = 0; index < aBytes.length; index += 1) {
    diff |= aBytes[index] ^ bBytes[index];
  }

  return diff === 0;
}

async function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)),
  );
  const received = normalizeSignature(signature);
  const expectedBase64 = encodeBase64(signatureBytes);
  const expectedHex = bytesToHex(signatureBytes);

  return timingSafeEqual(received, expectedBase64) || timingSafeEqual(received, expectedHex);
}

function getUserId(payloadData: WebhookPayload["data"]): string | undefined {
  return (
    getNestedString(payloadData?.checkout, ["metadata", "userId"]) ||
    getNestedString(payloadData?.subscription, ["metadata", "userId"]) ||
    getString(payloadData?.checkout?.externalId) ||
    getString(payloadData?.subscription?.externalId)
  );
}

function getCustomerData(customerData: Record<string, unknown> | undefined): {
  email: string;
  name: string;
  externalCustomerId: string | null;
} {
  const email = getString(customerData?.email);
  if (!email) throw new Error("Customer email missing from webhook payload");

  return {
    email,
    name: getString(customerData?.name) || email,
    externalCustomerId: getString(customerData?.id) || null,
  };
}

async function markLogError(logId: string | undefined, errorMessage: string) {
  if (!logId || !supabase) return;

  await supabase
    .from("webhook_logs")
    .update({
      status: "error",
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq("id", logId);
}

async function registerWebhookAttempt(payload: WebhookPayload) {
  if (!supabase) throw new Error("Supabase service role client not configured");

  const eventId = getString(payload.id);
  const eventType = getString(payload.event);

  if (!eventId) throw new Error("Webhook event id missing");
  if (!eventType) throw new Error("Webhook event type missing");

  const { data: logEntry, error: logError } = await supabase
    .from("webhook_logs")
    .insert({
      event_id: eventId,
      event_type: eventType,
      payload,
      gateway_provider: GATEWAY_PROVIDER,
      status: "pending",
    })
    .select()
    .single();

  if (!logError) {
    return { duplicate: false, logEntry, eventId, eventType };
  }

  if (logError.code !== "23505") {
    throw logError;
  }

  const { data: existingLog } = await supabase
    .from("webhook_logs")
    .select("id, duplicate_count")
    .eq("gateway_provider", GATEWAY_PROVIDER)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingLog) {
    await supabase
      .from("webhook_logs")
      .update({
        duplicate_count: (existingLog.duplicate_count ?? 0) + 1,
        last_duplicate_at: new Date().toISOString(),
      })
      .eq("id", existingLog.id);
  }

  return { duplicate: true, logEntry: existingLog, eventId, eventType };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!WEBHOOK_HMAC_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !supabase) {
    return jsonResponse({ error: "Webhook is not securely configured" }, 500);
  }

  const rawBody = await req.text();
  const signature = getSignature(req);

  if (!signature) {
    return jsonResponse({ error: "Missing webhook signature" }, 401);
  }

  const isValidSignature = await verifySignature(rawBody, signature, WEBHOOK_HMAC_SECRET);
  if (!isValidSignature) {
    return jsonResponse({ error: "Invalid webhook signature" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  let logId: string | undefined;

  try {
    const attempt = await registerWebhookAttempt(payload);

    if (attempt.duplicate) {
      return jsonResponse({ message: "Duplicate event ignored" }, 200);
    }

    logId = attempt.logEntry.id;

    const event = attempt.eventType;
    const data = payload.data ?? {};
    const userId = getUserId(data);

    if (!userId || !isUuid(userId)) {
      await markLogError(logId, "Valid user context not found");
      return jsonResponse({ error: "Valid user context not found" }, 422);
    }

    await supabase.from("webhook_logs").update({ user_id: userId }).eq("id", logId);

    if (event === "checkout.completed") {
      const checkout = data.checkout;
      const customer = getCustomerData(data.customer);
      const checkoutId = getString(checkout?.id);
      const planId = getNestedString(checkout, ["metadata", "planId"]);

      if (!checkoutId) throw new Error("Checkout id missing from webhook payload");

      if (planId) {
        await supabase.from("saas_subscriptions").upsert(
          {
            user_id: userId,
            plan_name: planId,
            status: "active",
            external_subscription_id: checkoutId,
            gateway_provider: GATEWAY_PROVIDER,
            expires_at: oneMonthFromNow(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }

      const { data: customerRecord, error: customerError } = await supabase
        .from("customers")
        .upsert(
          {
            user_id: userId,
            email: customer.email,
            name: customer.name,
            external_customer_id: customer.externalCustomerId,
            gateway_provider: GATEWAY_PROVIDER,
            status: "active",
          },
          { onConflict: "user_id,email" },
        )
        .select()
        .single();

      if (customerError) throw customerError;

      const { error: paymentError } = await supabase.from("payments").upsert(
        {
          user_id: userId,
          customer_id: customerRecord.id,
          amount: centsToCurrency(checkout?.amount),
          status: "paid",
          payment_method: getFirstString(checkout?.methods) || "PIX",
          external_payment_id: checkoutId,
          gateway_provider: GATEWAY_PROVIDER,
          paid_at: new Date().toISOString(),
        },
        { onConflict: "gateway_provider,external_payment_id" },
      );

      if (paymentError) throw paymentError;
    }

    if (event.startsWith("subscription.")) {
      const subscription = data.subscription;
      const customer = getCustomerData(data.customer);
      const subscriptionId = getString(subscription?.id);
      const planId = getNestedString(subscription, ["metadata", "planId"]);

      if (!subscriptionId) throw new Error("Subscription id missing from webhook payload");

      const subscriptionStatus = getString(subscription?.status);
      const normalizedStatus =
        subscriptionStatus === "ACTIVE"
          ? "active"
          : subscriptionStatus === "CANCELED"
            ? "canceled"
            : subscriptionStatus === "OVERDUE"
              ? "pending"
              : "inactive";
      const periodEnd =
        getString(subscription?.nextBillingAt) ||
        getString(subscription?.expiresAt) ||
        oneMonthFromNow();

      if (planId) {
        await supabase.from("saas_subscriptions").upsert(
          {
            user_id: userId,
            plan_name: planId,
            status: normalizedStatus,
            external_subscription_id: subscriptionId,
            gateway_provider: GATEWAY_PROVIDER,
            expires_at: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }

      const { data: customerRecord, error: customerError } = await supabase
        .from("customers")
        .upsert(
          {
            user_id: userId,
            email: customer.email,
            name: customer.name,
            external_customer_id: customer.externalCustomerId,
            gateway_provider: GATEWAY_PROVIDER,
            status: "active",
          },
          { onConflict: "user_id,email" },
        )
        .select()
        .single();

      if (customerError) throw customerError;

      const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          customer_id: customerRecord.id,
          external_subscription_id: subscriptionId,
          plan_name: getNestedString(subscription, ["product", "name"]) || "Assinatura AbacatePay",
          amount: centsToCurrency(subscription?.amount),
          status: normalizedStatus,
          gateway_provider: GATEWAY_PROVIDER,
          current_period_start:
            getString(subscription?.currentPeriodStart) ||
            getString(subscription?.startedAt) ||
            new Date().toISOString(),
          current_period_end: periodEnd,
          cancel_at_period_end: normalizedStatus === "canceled",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "external_subscription_id" },
      );

      if (subscriptionError) throw subscriptionError;
    }

    await supabase
      .from("webhook_logs")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", logId);

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Webhook processing error";
    console.error("Webhook processing error:", error);
    await markLogError(logId, errorMessage);
    return jsonResponse({ error: errorMessage }, 500);
  }
});
