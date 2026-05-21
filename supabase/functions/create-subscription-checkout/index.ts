import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v2";
const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FALLBACK_APP_URL = Deno.env.get("APP_URL") || Deno.env.get("SITE_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PlanId = "starter" | "pro" | "premium";

type Plan = {
  externalId: string;
  name: string;
  description: string;
  amount: number;
  envProductId: string;
};

type AbacatePayResponse<T> = {
  data?: T;
  error?: string | null;
  success?: boolean;
};

type AbacatePayProduct = {
  id?: string;
  externalId?: string;
  cycle?: string | null;
  status?: string;
};

type AbacatePayCheckout = {
  url?: string;
};

const plans: Record<PlanId, Plan> = {
  starter: {
    externalId: "precifika-starter-monthly",
    name: "Plano Starter",
    description: "Acesso mensal ao Precifika Starter.",
    amount: 4990,
    envProductId: "ABACATEPAY_PRODUCT_STARTER_ID",
  },
  pro: {
    externalId: "precifika-pro-monthly",
    name: "Plano Pro",
    description: "Acesso mensal ao Precifika Pro.",
    amount: 9990,
    envProductId: "ABACATEPAY_PRODUCT_PRO_ID",
  },
  premium: {
    externalId: "precifika-premium-monthly",
    name: "Plano Premium",
    description: "Acesso mensal ao Precifika Premium.",
    amount: 19990,
    envProductId: "ABACATEPAY_PRODUCT_PREMIUM_ID",
  },
};

class CheckoutError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "CHECKOUT_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request): string {
  const authorization = req.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new CheckoutError("Entre novamente para iniciar o checkout.", 401, "MISSING_SESSION");
  }

  return token;
}

function getAppOrigin(req: Request): string {
  const origin = req.headers.get("Origin");

  if (origin) {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.protocol === "https:" || parsedOrigin.protocol === "http:") {
      return parsedOrigin.origin;
    }
  }

  if (FALLBACK_APP_URL) {
    const parsedFallback = new URL(FALLBACK_APP_URL);
    return parsedFallback.origin;
  }

  throw new CheckoutError(
    "Nao foi possivel identificar a URL de retorno do checkout.",
    400,
    "MISSING_RETURN_URL",
  );
}

function validateEnvironment() {
  const missing = [
    !ABACATEPAY_API_KEY ? "ABACATEPAY_API_KEY" : null,
    !SUPABASE_URL ? "SUPABASE_URL" : null,
    !SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error("Missing checkout environment variables:", missing.join(", "));
    throw new CheckoutError(
      "Checkout indisponivel no momento. Fale com o suporte do Precifika.",
      500,
      "CHECKOUT_NOT_CONFIGURED",
    );
  }
}

function parsePlanId(value: unknown): PlanId {
  if (value === "starter" || value === "pro" || value === "premium") return value;
  throw new CheckoutError("Selecione um plano valido para continuar.", 400, "INVALID_PLAN");
}

async function callAbacatePay<T>(path: string, init: RequestInit): Promise<T> {
  if (!ABACATEPAY_API_KEY) {
    throw new CheckoutError(
      "Checkout indisponivel no momento. Fale com o suporte do Precifika.",
      500,
      "CHECKOUT_NOT_CONFIGURED",
    );
  }

  const response = await fetch(`${ABACATEPAY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
      ...(init.headers ?? {}),
    },
  });

  const result = (await response.json().catch(() => ({}))) as AbacatePayResponse<T>;

  if (!response.ok || result.success === false || result.error) {
    console.error("AbacatePay checkout error:", {
      status: response.status,
      path,
      error: result.error,
    });
    throw new CheckoutError(
      "Nao foi possivel abrir o checkout. Tente novamente em instantes.",
      response.status >= 400 ? response.status : 502,
      "ABACATEPAY_ERROR",
    );
  }

  if (!result.data) {
    throw new CheckoutError(
      "A Abacate Pay nao retornou os dados do checkout.",
      502,
      "ABACATEPAY_EMPTY_RESPONSE",
    );
  }

  return result.data;
}

async function getOrCreateProduct(plan: Plan): Promise<string> {
  const configuredProductId = Deno.env.get(plan.envProductId);
  if (configuredProductId) return configuredProductId;

  const query = new URLSearchParams({ externalId: plan.externalId, limit: "1" });
  const productList = await callAbacatePay<AbacatePayProduct[]>(
    `/products/list?${query.toString()}`,
    { method: "GET" },
  );
  const existingProduct = productList.find((product) => product.externalId === plan.externalId);

  if (existingProduct?.id) {
    if (existingProduct.status && existingProduct.status !== "ACTIVE") {
      throw new CheckoutError(
        "Este plano esta inativo na Abacate Pay. Fale com o suporte do Precifika.",
        409,
        "ABACATEPAY_PRODUCT_INACTIVE",
      );
    }

    if (existingProduct.cycle && existingProduct.cycle !== "MONTHLY") {
      throw new CheckoutError(
        "Este plano esta com recorrencia incorreta na Abacate Pay.",
        409,
        "ABACATEPAY_PRODUCT_CYCLE_MISMATCH",
      );
    }

    return existingProduct.id;
  }

  const createdProduct = await callAbacatePay<AbacatePayProduct>("/products/create", {
    method: "POST",
    body: JSON.stringify({
      externalId: plan.externalId,
      name: plan.name,
      description: plan.description,
      price: plan.amount,
      currency: "BRL",
      cycle: "MONTHLY",
      trialDays: 14,
    }),
  });

  if (!createdProduct.id) {
    throw new CheckoutError(
      "Nao foi possivel configurar o plano na Abacate Pay.",
      502,
      "ABACATEPAY_PRODUCT_MISSING_ID",
    );
  }

  return createdProduct.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido.", code: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    validateEnvironment();

    const token = getBearerToken(req);
    const appOrigin = getAppOrigin(req);
    const { planId: rawPlanId } = await req.json().catch(() => ({}));
    const planId = parsePlanId(rawPlanId);
    const plan = plans[planId];

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new CheckoutError("Entre novamente para iniciar o checkout.", 401, "INVALID_SESSION");
    }

    const productId = await getOrCreateProduct(plan);
    const checkout = await callAbacatePay<AbacatePayCheckout>("/subscriptions/create", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: productId, quantity: 1 }],
        methods: ["CARD"],
        returnUrl: `${appOrigin}/dashboard/pricing`,
        completionUrl: `${appOrigin}/dashboard?success=true`,
        externalId: `${user.id}:${planId}:${Date.now()}`,
        metadata: {
          userId: user.id,
          planId,
        },
      }),
    });

    if (!checkout.url) {
      throw new CheckoutError(
        "A Abacate Pay nao retornou o link de pagamento.",
        502,
        "ABACATEPAY_MISSING_CHECKOUT_URL",
      );
    }

    return jsonResponse({ url: checkout.url }, 200);
  } catch (error) {
    const checkoutError =
      error instanceof CheckoutError
        ? error
        : new CheckoutError(
            "Nao foi possivel iniciar o checkout. Tente novamente em instantes.",
            500,
            "UNEXPECTED_CHECKOUT_ERROR",
          );

    if (!(error instanceof CheckoutError)) {
      console.error("Unexpected checkout error:", error);
    }

    return jsonResponse(
      {
        error: checkoutError.message,
        code: checkoutError.code,
      },
      checkoutError.status,
    );
  }
});
