import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CreditCard, 
  LayoutDashboard, 
  LogOut, 
  User, 
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: Dashboard,
});

function Dashboard() {
  const { logout, session } = useAuth();
  
  const stats = [
    { label: "Total de Clientes", value: "1,284", icon: Users, change: "+12%", trendingUp: true },
    { label: "Assinaturas Ativas", value: "842", icon: Activity, change: "+5.4%", trendingUp: true },
    { label: "Receita Mensal", value: "R$ 42.500", icon: CreditCard, change: "+8.1%", trendingUp: true },
    { label: "Cancelamentos", value: "12", icon: ArrowDownRight, change: "-2%", trendingUp: false },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex flex-col">
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <span className="text-xl font-bold text-primary">Precifika</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <a href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Users className="h-4 w-4" />
            Clientes
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CreditCard className="h-4 w-4" />
            Assinaturas
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Settings className="h-4 w-4" />
            Configurações
          </a>
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900">
                {session?.user?.email?.split('@')[0] || "Usuário"}
              </p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-lg font-semibold text-slate-800 md:hidden">Precifika</h1>
          <div className="flex items-center gap-4">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
            <p className="text-slate-500 text-sm">Acompanhe o desempenho do seu negócio em tempo real.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <stat.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.trendingUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity / Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">Assinaturas Recentes</h3>
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        JD
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">João Silva</p>
                        <p className="text-xs text-slate-500">Plano Pro • R$ 149/mês</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">Próximos Vencimentos</h3>
              <div className="mt-4 space-y-4">
                 {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Maria Oliveira</p>
                      <p className="text-xs text-slate-500">Vence em 2 dias</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">R$ 49,00</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-6 text-xs h-9">
                Ver todos
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

