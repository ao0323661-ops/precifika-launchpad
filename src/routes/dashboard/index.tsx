import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, CheckCircle2, PackageCheck, TrendingUp } from "lucide-react";
import {
  DEMO_BADGE_LABEL,
  MOCK_DASHBOARD_STATS,
  MOCK_DEMO_INSIGHTS,
  MOCK_DEMO_PRODUCTS,
} from "@/lib/demo-config";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const dashboardRoute = getRouteApi("/dashboard");

function DashboardHome() {
  const { isDemo } = dashboardRoute.useRouteContext();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Geral</h1>
            {isDemo && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                {DEMO_BADGE_LABEL}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-slate-500">
            {isDemo
              ? "Dados fictícios de uma operação B2B para demonstrar métricas, alertas e oportunidades de precificação."
              : "Resumo comercial para acompanhar receita, margem e produtos que precisam de atenção."}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Atualizado há 12 minutos
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_DASHBOARD_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <span
                className={`rounded-full bg-slate-50 px-2 py-0.5 text-xs font-bold ${stat.color}`}
              >
                {stat.change}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Produtos com análise recente</h2>
              <p className="text-sm text-slate-500">
                Comparação entre preço atual e preço sugerido.
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Preço atual
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sugerido
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Margem
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_DEMO_PRODUCTS.map((product) => (
                  <tr key={product.name} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.currentPrice}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {product.suggestedPrice}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.margin}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Insights do período</h2>
                <p className="text-sm text-slate-500">Prioridades simuladas para o gestor.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {MOCK_DEMO_INSIGHTS.map((insight, index) => (
                <div key={insight} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                  {index === 0 ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <p className="text-sm leading-6 text-slate-600">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {isDemo && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-amber-700" />
                <h2 className="font-bold text-amber-950">{DEMO_BADGE_LABEL}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-900">
                Este painel não altera dados reais. Ações financeiras ou destrutivas permanecem
                bloqueadas enquanto a conta demo estiver ativa.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
