import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_USER, isDemoUser } from "@/lib/demo-config";
import type { Session } from "@supabase/supabase-js";

function createDemoSession(): Session {
  return {
    access_token: "demo-session",
    refresh_token: "demo-session",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "demo-user",
      aud: "authenticated",
      role: "authenticated",
      email: DEMO_USER.email,
      app_metadata: {},
      user_metadata: { name: "Usuário demo" },
      created_at: "2026-01-01T00:00:00.000Z",
    },
  } as Session;
}

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const demoParam = new URLSearchParams(location.searchStr).get("demo");
    const isDemoRoute = demoParam === "1" || demoParam === '"1"';

    if (isDemoRoute) {
      return {
        session: createDemoSession(),
        subscription: null,
        isActive: true,
        isExpired: false,
        isDemo: true,
      };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (isDemoUser(session.user.email)) {
      return { session, subscription: null, isActive: true, isExpired: false, isDemo: true };
    }

    const { data: subscription } = await supabase
      .from("saas_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const isExpired = subscription?.expires_at && new Date(subscription.expires_at) < new Date();
    const isActive =
      subscription?.status === "active" || (subscription?.status === "trial" && !isExpired);

    return { session, subscription, isActive, isExpired, isDemo: false };
  },
  component: DashboardShell,
});

function DashboardShell() {
  const { isActive, isExpired, isDemo } = Route.useRouteContext();
  const location = useLocation();
  const canViewPricing = location.pathname === "/dashboard/pricing";

  return (
    <DashboardLayout isDemo={isDemo}>
      {!isActive && !canViewPricing ? (
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            {isExpired ? (
              <RefreshCw className="h-10 w-10 text-amber-600" />
            ) : (
              <Lock className="h-10 w-10 text-amber-600" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isExpired ? "Renove seu acesso ao Precifika" : "Ative seu teste ou escolha um plano"}
            </h2>
            <p className="text-slate-500">
              {isExpired
                ? "Sua assinatura expirou. Para continuar usando o dashboard, renove seu plano na tela de preços."
                : "Não encontramos uma assinatura ativa para esta conta. Você pode iniciar um teste gratuito ou escolher um plano para liberar o dashboard."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" className="w-full py-6 text-lg font-bold" asChild>
              <Link to="/dashboard/pricing">Ver planos e preços</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Voltar para a página inicial</Link>
            </Button>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </DashboardLayout>
  );
}
