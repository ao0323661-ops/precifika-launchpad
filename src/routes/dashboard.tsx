import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (session.user.email === "demo@precifika.com") {
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

  // Se estiver na rota de pricing, permite ver mesmo sem assinatura ativa
  // Mas no TanStack Start, podemos verificar o path via useLocation se necessário,
  // ou simplesmente definir que o layout lida com o estado global.

  return (
    <DashboardLayout isDemo={isDemo}>
      {!isActive ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto">
          <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center">
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
                : "Você ainda não possui uma assinatura ativa. Escolha um plano para liberar todas as funcionalidades do dashboard."}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => (window.location.href = "/dashboard/pricing")}
              size="lg"
              className="w-full text-lg font-bold py-6"
            >
              Ver Planos e Preços
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = "/")}>
              Voltar para a Home
            </Button>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </DashboardLayout>
  );
}
