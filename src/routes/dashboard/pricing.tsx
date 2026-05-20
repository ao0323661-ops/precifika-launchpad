import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const isDemo = true; // For now, we are in demo mode

  const handleSubscribe = () => {
    if (isDemo) {
      toast.info("No modo demonstração, as assinaturas são simuladas. Você já possui acesso completo!", {
        duration: 5000,
      });
      return;
    }
    // Lógica real de checkout aqui
  };

  const plans = [
    {
      name: "Starter",
      price: "R$ 49",
      features: ["Até 50 produtos", "Cálculo de margem e custo", "1 usuário", "Suporte por email"],
    },
    {
      name: "Pro",
      price: "R$ 149",
      features: ["Produtos ilimitados", "Dashboards avançados", "Até 5 usuários", "Simulações de cenário"],
      highlight: true,
    },
    {
      name: "Premium",
      price: "R$ 399",
      features: ["Tudo do Pro", "Usuários ilimitados", "Integrações via API", "Gerente de conta dedicado"],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Planos e Preços</h2>
        <p className="mt-4 text-lg text-slate-600">Escolha o plano ideal para o momento do seu negócio.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl p-8 border ${
              p.highlight 
                ? "border-primary shadow-xl shadow-primary/10 relative" 
                : "border-slate-200 bg-white"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                Mais Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">{p.price}</span>
              <span className="text-slate-500 text-sm">/mês</span>
            </div>
            <ul className="mt-8 space-y-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleSubscribe}
              className={`mt-10 w-full py-6 text-lg font-bold ${
                p.highlight ? "bg-primary" : "variant-outline"
              }`}
            >
              Assinar agora
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
