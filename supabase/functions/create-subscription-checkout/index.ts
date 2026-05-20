import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { planId, frequency } = await req.json();

    const planData: Record<string, any> = {
      starter: { name: "Plano Starter", amount: 4990 },
      pro: { name: "Plano Pro", amount: 9990 },
      premium: { name: "Plano Premium", amount: 19990 },
    };

    const selectedPlan = planData[planId];
    if (!selectedPlan) throw new Error("Invalid Plan");

    // Create Checkout in Abacate Pay
    const response = await fetch("https://api.abacatepay.com/v1/checkout/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ABACATEPAY_API_KEY}`
      },
      body: JSON.stringify({
        frequency: frequency || "MONTHLY",
        methods: ["PIX"],
        products: [{
          name: selectedPlan.name,
          quantity: 1,
          price: selectedPlan.amount,
        }],
        returnUrl: `${req.headers.get("origin")}/dashboard`,
        completionUrl: `${req.headers.get("origin")}/dashboard?success=true`,
        customerId: user.id, // We'll use this to match in webhook
        externalId: user.id,
        metadata: {
          userId: user.id,
          planId: planId
        }
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to create checkout");

    return new Response(JSON.stringify({ url: result.data.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
