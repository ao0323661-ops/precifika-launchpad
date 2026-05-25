import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_PROVIDER = "abacatepay";
const SIGNATURE_HEADER = "X-Webhook-Signature";
const WEBHOOK_SECRET_HEADER = "X-Webhook-Secret";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_QUERY_SECRET = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");
const ABACATEPAY_PUBLIC_KEY = Deno.env.get("ABACATEPAY_PUBLIC_KEY");
const SIGNATURE_DIAGNOSTIC_HEADERS = [
  "X-Webhook-Signature",
  "X-Abacate-Signature",
  "X-AbacatePay-Signature",
  "X-Abacatepay-Signature",
];

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

type WebhookPayload = {
  id?: unknown;
  event?: unknown;
  data?: {
    checkout?: Record<string, unknown>;
    customer?: Record<string, unknown> | null;
    payment?: Record<string, unknown>;
    payerInformation?: Record<string, unknown>;
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
  return getString(req.headers.get(SIGNATURE_HEADER));
}

function getHeaderNames(req: Request): string[] {
  return Array.from(req.headers.keys()).sort();
}

function getWebhookSecret(req: Request): string | undefined {
  return getString(new URL(req.url).searchParams.get("webhookSecret"));
}

function getXWebhookSecret(req: Request): string | undefined {
  return getString(req.headers.get(WEBHOOK_SECRET_HEADER));
}

type WebhookRequestLogContext = {
  detectedEvent: string | null;
  hasSignatureHeader: boolean;
  hasWebhookSecretParam: boolean;
  headerNames: string[];
  method: string;
  rawBodyByteLength: number | null;
  queryWebhookSecretMatchesEnv: boolean;
  xWebhookSecretMatchesEnv: boolean;
  xWebhookSecretPresent: boolean;
};

function buildWebhookLogContext(
  req: Request,
  rawBody: string | null,
  detectedEvent: string | null,
): WebhookRequestLogContext {
  const url = new URL(req.url);
  const queryWebhookSecret = getWebhookSecret(req);
  const xWebhookSecret = getXWebhookSecret(req);

  return {
    detectedEvent,
    hasSignatureHeader: req.headers.has(SIGNATURE_HEADER),
    hasWebhookSecretParam: url.searchParams.has("webhookSecret"),
    headerNames: getHeaderNames(req),
    method: req.method,
    rawBodyByteLength: rawBody === null ? null : new TextEncoder().encode(rawBody).length,
    queryWebhookSecretMatchesEnv: Boolean(
      WEBHOOK_QUERY_SECRET &&
      queryWebhookSecret &&
      timingSafeEqual(queryWebhookSecret, WEBHOOK_QUERY_SECRET),
    ),
    xWebhookSecretMatchesEnv: Boolean(
      WEBHOOK_QUERY_SECRET &&
      xWebhookSecret &&
      timingSafeEqual(xWebhookSecret, WEBHOOK_QUERY_SECRET),
    ),
    xWebhookSecretPresent: Boolean(xWebhookSecret),
  };
}

function getSignatureHeaderPresence(req: Request): Record<string, boolean> {
  return Object.fromEntries(
    SIGNATURE_DIAGNOSTIC_HEADERS.map((header) => [header, req.headers.has(header)]),
  );
}

function logWebhookRequest(context: WebhookRequestLogContext) {
  console.info("Abacate Pay webhook request received:", context);
}

function logWebhookFailure(
  reason: string,
  context: WebhookRequestLogContext,
  extra: Record<string, unknown> = {},
) {
  console.warn("Abacate Pay webhook rejected:", {
    ...context,
    reason,
    ...extra,
  });
}

function logWebhookInfo(
  message: string,
  context: WebhookRequestLogContext,
  extra: Record<string, unknown> = {},
) {
  console.info(message, {
    ...context,
    ...extra,
  });
}

function oneMonthFromNow(): string {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt.toISOString();
}

function normalizeSignature(signature: string): string {
  return signature.trim();
}

function stripSha256Prefix(signature: string): string {
  const trimmed = normalizeSignature(signature);
  return trimmed.toLowerCase().startsWith("sha256=") ? trimmed.slice(7) : trimmed;
}

function looksLikeBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length % 4 === 0;
}

function looksLikeHex(value: string): boolean {
  return /^[0-9a-f]+$/i.test(value) && value.length % 2 === 0;
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

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signWebhookBody(rawBody: string, keyMaterial: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
}

async function verifySignature(
  rawBody: string,
  signature: string,
  publicKey: string,
  xWebhookSecret: string | undefined,
): Promise<boolean> {
  const received = normalizeSignature(signature);
  const publicKeySignature = await signWebhookBody(rawBody, publicKey);
  const publicKeyBase64 = encodeBase64(publicKeySignature);

  if (timingSafeEqual(received, publicKeyBase64)) return true;

  if (xWebhookSecret) {
    const xWebhookSecretSignature = await signWebhookBody(rawBody, xWebhookSecret);
    const xWebhookSecretBase64 = encodeBase64(xWebhookSecretSignature);
    return timingSafeEqual(received, xWebhookSecretBase64);
  }

  return false;
}

async function getHmacDiagnostics(
  rawBody: string,
  signature: string,
  xWebhookSecret: string | undefined,
) {
  const received = normalizeSignature(signature);
  const receivedWithoutPrefix = stripSha256Prefix(signature);
  const hasSha256Prefix = received !== receivedWithoutPrefix;
  const diagnostics: Record<string, unknown> = {
    signatureLength: received.length,
    signatureStartsWithSha256Prefix: hasSha256Prefix,
    signatureLooksBase64: looksLikeBase64(receivedWithoutPrefix),
    signatureLooksHex: looksLikeHex(receivedWithoutPrefix),
  };

  if (ABACATEPAY_PUBLIC_KEY) {
    const publicKeySignature = await signWebhookBody(rawBody, ABACATEPAY_PUBLIC_KEY);
    const publicKeyBase64 = encodeBase64(publicKeySignature);
    const publicKeyHex = bufferToHex(publicKeySignature);

    diagnostics.publicKeyRawBodyBase64Match = timingSafeEqual(received, publicKeyBase64);
    diagnostics.publicKeyRawBodyHexMatch = timingSafeEqual(received, publicKeyHex);
    diagnostics.publicKeyRawBodyBase64MatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      publicKeyBase64,
    );
    diagnostics.publicKeyRawBodyHexMatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      publicKeyHex,
    );
  }

  if (WEBHOOK_QUERY_SECRET) {
    const secretSignature = await signWebhookBody(rawBody, WEBHOOK_QUERY_SECRET);
    const secretBase64 = encodeBase64(secretSignature);
    const secretHex = bufferToHex(secretSignature);

    diagnostics.webhookSecretRawBodyBase64Match = timingSafeEqual(received, secretBase64);
    diagnostics.webhookSecretRawBodyHexMatch = timingSafeEqual(received, secretHex);
    diagnostics.webhookSecretRawBodyBase64MatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      secretBase64,
    );
    diagnostics.webhookSecretRawBodyHexMatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      secretHex,
    );
  }

  if (xWebhookSecret) {
    const xWebhookSecretSignature = await signWebhookBody(rawBody, xWebhookSecret);
    const xWebhookSecretBase64 = encodeBase64(xWebhookSecretSignature);
    const xWebhookSecretHex = bufferToHex(xWebhookSecretSignature);

    diagnostics.hmacWithXWebhookSecretBase64Match = timingSafeEqual(received, xWebhookSecretBase64);
    diagnostics.hmacWithXWebhookSecretHexMatch = timingSafeEqual(received, xWebhookSecretHex);
    diagnostics.hmacWithXWebhookSecretBase64MatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      xWebhookSecretBase64,
    );
    diagnostics.hmacWithXWebhookSecretHexMatchWithoutPrefix = timingSafeEqual(
      receivedWithoutPrefix,
      xWebhookSecretHex,
    );
  } else {
    diagnostics.hmacWithXWebhookSecretBase64Match = false;
    diagnostics.hmacWithXWebhookSecretHexMatch = false;
  }

  return diagnostics;
}

function verifyWebhookSecret(req: Request): boolean {
  if (!WEBHOOK_QUERY_SECRET) return false;

  const querySecret = getWebhookSecret(req);
  const xWebhookSecret = getXWebhookSecret(req);

  return Boolean(
    (querySecret && timingSafeEqual(querySecret, WEBHOOK_QUERY_SECRET)) ||
    (xWebhookSecret && timingSafeEqual(xWebhookSecret, WEBHOOK_QUERY_SECRET)),
  );
}

function getUserId(payloadData: WebhookPayload["data"]): string | undefined {
  return [
    getNestedString(payloadData?.checkout, ["metadata", "userId"]),
    getNestedString(payloadData?.subscription, ["metadata", "userId"]),
    getString(payloadData?.checkout?.externalId),
    getString(payloadData?.subscription?.externalId),
    getString(payloadData?.payment?.externalId),
  ]
    .map(parseUserId)
    .find(Boolean);
}

function parseUserId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (isUuid(value)) return value;

  const [candidate] = value.split(":");
  return candidate && isUuid(candidate) ? candidate : undefined;
}

function parseWebhookPayload(rawBody: string): {
  error?: Error;
  event: string | null;
  payload?: WebhookPayload;
} {
  try {
    const payload = JSON.parse(rawBody) as WebhookPayload;

    return {
      event: getString(payload.event) ?? null,
      payload,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Invalid JSON"),
      event: null,
    };
  }
}

type CustomerData = {
  email: string;
  name: string;
  externalCustomerId: string | null;
};

async function getUserFallbackCustomer(
  userId: string,
): Promise<Pick<CustomerData, "email" | "name">> {
  const fallbackEmail = `abacatepay-${userId}@precifika.local`;

  if (!supabase) {
    return { email: fallbackEmail, name: "Cliente Abacate Pay" };
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.warn("Could not load user for webhook customer fallback:", {
      userId,
      code: error.code,
      status: error.status,
      name: error.name,
    });
  }

  const user = data?.user;
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const name =
    getString(metadata?.display_name) ||
    getString(metadata?.name) ||
    getString(metadata?.full_name) ||
    getString(user?.email) ||
    "Cliente Abacate Pay";

  return {
    email: getString(user?.email) || fallbackEmail,
    name,
  };
}

async function getCustomerData(
  payloadData: WebhookPayload["data"],
  userId: string,
): Promise<CustomerData> {
  const customerData = payloadData?.customer ?? undefined;
  const email = getString(customerData?.email);
  const fallback = email ? null : await getUserFallbackCustomer(userId);
  const payerName =
    getNestedString(payloadData?.payerInformation, ["PIX", "name"]) ||
    getNestedString(payloadData?.payerInformation, ["BOLETO", "name"]);

  return {
    email: email || fallback?.email || `abacatepay-${userId}@precifika.local`,
    name:
      getString(customerData?.name) ||
      payerName ||
      fallback?.name ||
      email ||
      "Cliente Abacate Pay",
    externalCustomerId:
      getString(customerData?.id) ||
      getString(payloadData?.checkout?.customerId) ||
      getString(payloadData?.subscription?.customerId) ||
      null,
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

function getSafeErrorInfo(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const record = error as Record<string, unknown>;

  return {
    code: typeof record.code === "string" ? record.code : undefined,
    details: typeof record.details === "string" ? record.details : undefined,
    hint: typeof record.hint === "string" ? record.hint : undefined,
    message: error instanceof Error ? error.message : getString(record.message),
    name: error instanceof Error ? error.name : getString(record.name),
    status:
      typeof record.status === "number" || typeof record.status === "string"
        ? record.status
        : undefined,
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    const context = buildWebhookLogContext(req, null, null);
    logWebhookRequest(context);
    logWebhookFailure("method_not_allowed", context);
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();
  const parsedPayload = parseWebhookPayload(rawBody);
  const context = buildWebhookLogContext(req, rawBody, parsedPayload.event);
  logWebhookRequest(context);

  const signatureHeaderPresence = getSignatureHeaderPresence(req);

  const signature = getSignature(req);
  const xWebhookSecret = getXWebhookSecret(req);

  if (!signature) {
    logWebhookFailure("missing_signature", context, { signatureHeaderPresence });
    return jsonResponse({ error: "Missing webhook signature" }, 401);
  }

  if (
    !WEBHOOK_QUERY_SECRET ||
    !ABACATEPAY_PUBLIC_KEY ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !supabase
  ) {
    const configState = {
      hasWebhookQuerySecret: Boolean(WEBHOOK_QUERY_SECRET),
      hasAbacatePayPublicKey: Boolean(ABACATEPAY_PUBLIC_KEY),
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseClient: Boolean(supabase),
    };
    console.error("Abacate Pay webhook is not securely configured:", configState);
    logWebhookFailure("insecure_configuration", context, configState);
    return jsonResponse({ error: "Webhook is not securely configured" }, 500);
  }

  if (!verifyWebhookSecret(req)) {
    logWebhookFailure("invalid_webhook_secret", context, { signatureHeaderPresence });
    return jsonResponse({ error: "Invalid webhook secret" }, 401);
  }

  const isValidSignature = await verifySignature(
    rawBody,
    signature,
    ABACATEPAY_PUBLIC_KEY,
    xWebhookSecret,
  );
  if (!isValidSignature) {
    logWebhookFailure("invalid_signature", context, {
      hmacDiagnostics: await getHmacDiagnostics(rawBody, signature, xWebhookSecret),
      signatureHeaderPresence,
    });
    return jsonResponse({ error: "Invalid webhook signature" }, 401);
  }

  logWebhookInfo("Abacate Pay webhook signature verified:", context);

  if (!parsedPayload.payload) {
    logWebhookFailure("invalid_json", context, {
      parseError: getSafeErrorInfo(parsedPayload.error),
    });
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const payload = parsedPayload.payload;
  let logId: string | undefined;

  try {
    const attempt = await registerWebhookAttempt(payload);
    logWebhookInfo("Abacate Pay webhook log attempt registered:", context, {
      duplicate: attempt.duplicate,
      eventIdPresent: Boolean(attempt.eventId),
      eventType: attempt.eventType,
      logEntryPresent: Boolean(attempt.logEntry),
    });

    if (attempt.duplicate) {
      return jsonResponse({ message: "Duplicate event ignored" }, 200);
    }

    logId = attempt.logEntry.id;

    const event = attempt.eventType;
    const data = payload.data ?? {};
    const userId = getUserId(data);

    if (!userId || !isUuid(userId)) {
      await markLogError(logId, "Valid user context not found");
      logWebhookFailure("valid_user_context_not_found", context, {
        logIdPresent: Boolean(logId),
      });
      return jsonResponse({ error: "Valid user context not found" }, 422);
    }

    await supabase.from("webhook_logs").update({ user_id: userId }).eq("id", logId);

    if (event === "checkout.completed") {
      const checkout = data.checkout;
      const customer = await getCustomerData(data, userId);
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
      const customer = await getCustomerData(data, userId);
      const subscriptionId = getString(subscription?.id);
      const planId = getNestedString(subscription, ["metadata", "planId"]);

      if (!subscriptionId) throw new Error("Subscription id missing from webhook payload");

      const subscriptionStatus = getString(subscription?.status)?.toUpperCase();
      const normalizedStatus =
        event === "subscription.trial_started"
          ? "trial"
          : subscriptionStatus === "ACTIVE"
            ? "active"
            : subscriptionStatus === "CANCELED" || subscriptionStatus === "CANCELLED"
              ? "canceled"
              : subscriptionStatus === "OVERDUE"
                ? "pending"
                : "inactive";
      const periodEnd =
        (event === "subscription.trial_started"
          ? getString(subscription?.trialEndsAt)
          : undefined) ||
        getString(subscription?.nextBillingAt) ||
        getString(subscription?.expiresAt) ||
        getString(subscription?.trialEndsAt) ||
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
            getString(subscription?.createdAt) ||
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

    logWebhookInfo("Abacate Pay webhook processed successfully:", context, {
      event,
      logIdPresent: Boolean(logId),
    });
    return jsonResponse({ success: true }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Webhook processing error";
    logWebhookFailure("processing_error", context, {
      error: getSafeErrorInfo(error),
      logIdPresent: Boolean(logId),
    });
    await markLogError(logId, errorMessage);
    return jsonResponse({ error: errorMessage }, 500);
  }
});
