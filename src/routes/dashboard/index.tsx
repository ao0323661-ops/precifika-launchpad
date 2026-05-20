import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel Geral</h1>
        <p className="text-slate-500 mt-1">
          Bem-vindo ao Precifika. Aqui está um resumo do seu negócio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Receita Total",
            value: "R$ 12.450,00",
            change: "+12.5%",
            color: "text-emerald-600",
          },
          { label: "Margem Média", value: "42%", change: "+2.1%", color: "text-emerald-600" },
          { label: "Novas Assinaturas", value: "18", change: "+4", color: "text-primary" },
          {
            label: "Pagamentos Pendentes",
            value: "R$ 1.200,00",
            change: "-2%",
            color: "text-amber-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 ${stat.color}`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Modo de Apresentação Ativo</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Este é um ambiente de demonstração com dados simulados para ilustrar as funcionalidades da
          plataforma.
        </p>
      </div>
    </div>
  );
}
