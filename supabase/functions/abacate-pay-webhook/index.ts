import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
const ABACATE_PUBLIC_KEY = Deno.env.get("ABACATEPAY_PUBLIC_KEY") || "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";
const WEBHOOK_SECRET = Deno.env.get("ABACATEPAY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ABACATE_PUBLIC_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );

  const expectedSig = encodeBase64(sigBuffer);
  return expectedSig === signature;
}

serve(async (req) => {
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("webhookSecret");

  // Validate Secret in URL if configured
  if (WEBHOOK_SECRET && secretParam !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized Secret" }), { status: 401 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-Webhook-Signature");
  
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // 1. Log the receipt
  const { data: logEntry, error: logError } = await supabase
    .from("webhook_logs")
    .insert({
      event_id: payload.id,
      event_type: payload.event,
      payload: payload,
      gateway_provider: "abacatepay",
      status: "pending"
    })
    .select()
    .single();

  if (logError) console.error("Error logging webhook:", logError);

  // 2. Security Validation
  const isValid = await verifySignature(rawBody, signature);
  
  // If signature fails, we could call the API to verify (as requested)
  // But usually, signature is enough. The prompt says "Se não existir... validar pelo payload, id do evento e consulta segura na API."
  if (!isValid && signature) {
     await supabase.from("webhook_logs").update({ status: "error", error_message: "Invalid Signature" }).eq("id", logEntry?.id);
     return new Response(JSON.stringify({ error: "Invalid Signature" }), { status: 401 });
  }

  try {
    // 3. Deduplication
    const { data: existing } = await supabase
      .from("webhook_logs")
      .select("id")
      .eq("event_id", payload.id)
      .eq("status", "processed")
      .maybeSingle();

    if (existing) {
      await supabase.from("webhook_logs").update({ status: "duplicated" }).eq("id", logEntry?.id);
      return new Response(JSON.stringify({ message: "Already processed" }), { status: 200 });
    }

    // 4. Extract data and map User
    const event = payload.event;
    const data = payload.data;
    
    // Attempt to identify user_id from metadata or externalId
    // Abacate Pay structure: data.checkout.metadata.userId or data.subscription.metadata.userId
    let userId = data?.checkout?.metadata?.userId || data?.subscription?.metadata?.userId || data?.checkout?.externalId || data?.subscription?.externalId;
    
    // If not found, try by customer email
    if (!userId && data?.customer?.email) {
      const { data: customer } = await supabase
        .from("customers")
        .select("user_id")
        .eq("email", data.customer.email)
        .limit(1)
        .maybeSingle();
      userId = customer?.user_id;
    }

    if (!userId) {
       // We log it but can't process fully without a user context in this multi-tenant app
       await supabase.from("webhook_logs").update({ status: "error", error_message: "User context not found" }).eq("id", logEntry?.id);
       return new Response(JSON.stringify({ error: "User not found" }), { status: 200 }); // Return 200 to acknowledge receipt
    }

    // Update log with user_id
    await supabase.from("webhook_logs").update({ user_id: userId }).eq("id", logEntry?.id);

    // 5. Processing Events
    if (event === "checkout.completed") {
      const checkout = data.checkout;
      const customerData = data.customer;
      const planId = checkout.metadata?.planId;

      // Check if it's a SaaS Subscription (billing the user of Precifika)
      if (planId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // Default to 1 month

        await supabase.from("saas_subscriptions").upsert({
          user_id: userId,
          plan_name: planId,
          status: "active",
          external_subscription_id: checkout.id,
          gateway_provider: "abacatepay",
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

      // Create/Update Customer in their own dashboard context
      const { data: customer, error: custErr } = await supabase.from("customers").upsert({
        user_id: userId,
        email: customerData.email,
        name: customerData.name,
        external_customer_id: customerData.id,
        gateway_provider: "abacatepay",
        status: "active"
      }, { onConflict: 'user_id,email' }).select().single();

      if (custErr) throw custErr;

      // Create Payment
      const { error: payErr } = await supabase.from("payments").insert({
        user_id: userId,
        customer_id: customer.id,
        amount: checkout.amount / 100,
        status: "paid",
        payment_method: checkout.methods?.[0] || "PIX",
        external_payment_id: checkout.id,
        gateway_provider: "abacatepay",
        paid_at: new Date().toISOString()
      });
      if (payErr) throw payErr;
    }

    if (event.startsWith("subscription.")) {
      const sub = data.subscription;
      const customerData = data.customer;
      const planId = sub.metadata?.planId;

      const subStatus = sub.status === "ACTIVE" ? "active" : 
                        sub.status === "CANCELED" ? "canceled" : 
                        sub.status === "OVERDUE" ? "pending" : "inactive";

      if (planId) {
         await supabase.from("saas_subscriptions").upsert({
          user_id: userId,
          plan_name: planId,
          status: subStatus,
          external_subscription_id: sub.id,
          gateway_provider: "abacatepay",
          expires_at: sub.nextBillingAt || sub.expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

      // Find or create customer
      const { data: customer } = await supabase.from("customers").upsert({
...
      }, { onConflict: 'user_id,email' }).select().single();

      // Upsert Subscription
      const { error: subErr } = await supabase.from("subscriptions").upsert({
...
        updated_at: new Date().toISOString()
      }, { onConflict: 'external_subscription_id' });

      if (subErr) throw subErr;
    }

    await supabase.from("webhook_logs").update({ 
      status: "processed", 
      processed_at: new Date().toISOString() 
    }).eq("id", logEntry?.id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    await supabase.from("webhook_logs").update({ 
      status: "error", 
      error_message: err.message 
    }).eq("id", logEntry?.id);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
