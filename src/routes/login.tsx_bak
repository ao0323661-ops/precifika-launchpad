import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    const { data: subscription } = await supabase
      .from("saas_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const isExpired = Boolean(
      subscription?.expires_at && new Date(subscription.expires_at) < new Date(),
    );
    const isActive =
      subscription?.status === "active" || (subscription?.status === "trial" && !isExpired);

    return { session, subscription, isActive, isExpired };
  },
  component: DashboardShell,
});

function DashboardShell() {
  const { isActive, isExpired } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const location = useLocation();
  const isPricingRoute = location.pathname === "/dashboard/pricing";

  if (!isActive && !isPricingRoute) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            {isExpired ? (
              <RefreshCw className="h-10 w-10 text-amber-600" />
            ) : (
              <Lock className="h-10 w-10 text-amber-600" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isExpired ? "Assinatura Expirada" : "Acesso Limitado"}
            </h2>
            <p className="text-slate-500">
              {isExpired
                ? "Sua assinatura do Precifika expirou. Renove agora para continuar gerenciando seus clientes e pagamentos."
                : "Voce ainda nao possui uma assinatura ativa. Escolha um plano para liberar todas as funcionalidades do dashboard."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button
              onClick={() => navigate({ to: "/dashboard/pricing" })}
              size="lg"
              className="w-full py-6 text-lg font-bold"
            >
              Ver Planos e Precos
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = "/"}>
              Voltar para a Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
