import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Lock,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw { redirect: "/login" };

    // Check SaaS Subscription
    const { data: subscription } = await supabase
      .from("saas_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const isExpired = subscription?.expires_at && new Date(subscription.expires_at) < new Date();
    const isActive = subscription?.status === 'active' || (subscription?.status === 'trial' && !isExpired);

    return { session, subscription, isActive, isExpired };
  },
  component: Dashboard,
});


const data = [
  { name: "Jan", revenue: 4000, subscriptions: 240 },
  { name: "Fev", revenue: 3000, subscriptions: 139 },
  { name: "Mar", revenue: 2000, subscriptions: 980 },
  { name: "Abr", revenue: 2780, subscriptions: 390 },
  { name: "Mai", revenue: 1890, subscriptions: 480 },
  { name: "Jun", revenue: 2390, subscriptions: 380 },
  { name: "Jul", revenue: 3490, subscriptions: 430 },
];

function Dashboard() {
  const { isActive, isExpired, subscription } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  if (!isActive) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto">
          <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center">
            {isExpired ? <RefreshCw className="h-10 w-10 text-amber-600 animate-spin-slow" /> : <Lock className="h-10 w-10 text-amber-600" />}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {isExpired ? 'Assinatura Expirada' : 'Acesso Limitado'}
            </h2>
            <p className="text-slate-500">
              {isExpired 
                ? 'Sua assinatura do Precifika expirou. Renove agora para continuar gerenciando seus clientes e pagamentos.'
                : 'Você ainda não possui uma assinatura ativa. Escolha um plano para liberar todas as funcionalidades do dashboard.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={() => navigate({ to: '/dashboard/pricing' })} size="lg" className="w-full text-lg font-bold py-6">
              Ver Planos e Preços
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              Voltar para a Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Receita Mensal", value: "R$ 42.500", icon: CreditCard, change: "+12.5%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Assinaturas Ativas", value: "1,284", icon: Activity, change: "+5.4%", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Cancelamentos", value: "12", icon: Users, change: "-2%", color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Pagamentos Pendentes", value: "8", icon: BarChart3, change: "Estável", color: "text-amber-600", bg: "bg-amber-50" },
  ];


  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm">Bem-vindo ao seu centro de controle Precifika.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={cn("rounded-lg p-2", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">Receita Mensal (R$)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">Novas Assinaturas</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="subscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Atividades Recentes</h3>
            <button className="text-sm font-medium text-primary hover:underline">Ver todas</button>
          </div>
          <div className="space-y-4">
            {subscription?.status === 'trial' && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 border border-blue-100 text-blue-700 text-xs font-medium">
                <Sparkles className="h-4 w-4" />
                Seu período de Trial expira em {new Date(subscription.expires_at).toLocaleDateString()}
              </div>
            )}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    US
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Nova assinatura: Cliente #{i}</p>
                    <p className="text-xs text-slate-500">Há {i * 10} minutos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">R$ 149,00</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Pago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
