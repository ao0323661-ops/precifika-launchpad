import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CreditCard,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

const dashboardRoute = getRouteApi("/dashboard");

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string | null;
  customers: { name: string | null; email: string | null } | null;
};

type SubscriptionRow = {
  id: string;
  status: string;
  created_at: string;
  current_period_end: string;
};

type ChartPoint = {
  name: string;
  revenue: number;
  subscriptions: number;
};

type Metrics = {
  monthlyRevenue: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  pendingPayments: number;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildMonthlySeries(payments: PaymentRow[], subscriptions: SubscriptionRow[]) {
  const firstMonth = startOfMonth(new Date());
  firstMonth.setMonth(firstMonth.getMonth() - 6);

  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstMonth);
    date.setMonth(firstMonth.getMonth() + index);
    return date;
  });

  return months.map<ChartPoint>((date) => {
    const paidInMonth = payments.filter(
      (payment) => payment.status === "paid" && sameMonth(new Date(payment.created_at), date),
    );
    const newSubscriptions = subscriptions.filter((subscription) =>
      sameMonth(new Date(subscription.created_at), date),
    );

    return {
      name: date.toLocaleDateString("pt-BR", { month: "short" }),
      revenue: paidInMonth.reduce((sum, payment) => sum + Number(payment.amount), 0),
      subscriptions: newSubscriptions.length,
    };
  });
}

function DashboardIndex() {
  const { session, subscription } = dashboardRoute.useRouteContext();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setLoadError(false);

      const fromDate = startOfMonth(new Date());
      fromDate.setMonth(fromDate.getMonth() - 6);

      const [paymentsResult, subscriptionsResult] = await Promise.all([
        supabase
          .from("payments")
          .select("id, amount, status, created_at, payment_method, customers(name, email)")
          .eq("user_id", session.user.id)
          .gte("created_at", fromDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("subscriptions")
          .select("id, status, created_at, current_period_end")
          .eq("user_id", session.user.id)
          .gte("created_at", fromDate.toISOString())
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (paymentsResult.error || subscriptionsResult.error) {
        setLoadError(true);
        toast.error("Erro ao carregar dados do dashboard");
        setPayments([]);
        setSubscriptions([]);
      } else {
        setPayments((paymentsResult.data ?? []) as PaymentRow[]);
        setSubscriptions((subscriptionsResult.data ?? []) as SubscriptionRow[]);
      }

      setLoading(false);
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  const metrics = useMemo<Metrics>(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const currentMonthPayments = payments.filter(
      (payment) => payment.status === "paid" && new Date(payment.created_at) >= monthStart,
    );

    return {
      monthlyRevenue: currentMonthPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ),
      activeSubscriptions: subscriptions.filter((subscription) => subscription.status === "active")
        .length,
      canceledSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === "canceled",
      ).length,
      pendingPayments: payments.filter((payment) => payment.status === "pending").length,
    };
  }, [payments, subscriptions]);

  const chartData = useMemo(
    () => buildMonthlySeries(payments, subscriptions),
    [payments, subscriptions],
  );
  const recentPayments = payments.slice(0, 5);

  const stats = [
    {
      label: "Receita Mensal",
      value: loading ? "..." : formatCurrency(metrics.monthlyRevenue),
      icon: CreditCard,
      change: "Mes atual",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: TrendingUp,
    },
    {
      label: "Assinaturas Ativas",
      value: loading ? "..." : String(metrics.activeSubscriptions),
      icon: Activity,
      change: "Agora",
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: TrendingUp,
    },
    {
      label: "Cancelamentos",
      value: loading ? "..." : String(metrics.canceledSubscriptions),
      icon: Users,
      change: "Historico",
      color: "text-rose-600",
      bg: "bg-rose-50",
      trend: TrendingDown,
    },
    {
      label: "Pagamentos Pendentes",
      value: loading ? "..." : String(metrics.pendingPayments),
      icon: BarChart3,
      change: "Abertos",
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Bem-vindo ao seu centro de controle Precifika.</p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nao foi possivel carregar os indicadores agora. Tente atualizar a pagina.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={cn("rounded-lg p-2", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                <stat.trend className="h-3 w-3" />
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-semibold text-slate-800">Receita Mensal (R$)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-semibold text-slate-800">Novas Assinaturas</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="subscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Atividades Recentes</h3>
          <Link
            to="/dashboard/payments"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="space-y-4">
          {subscription?.status === "trial" && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              Seu periodo de trial expira em{" "}
              {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">Carregando atividades...</div>
          ) : recentPayments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Nenhuma atividade financeira registrada ainda.
            </div>
          ) : (
            recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {(payment.customers?.name?.[0] ?? "C").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      Pagamento de {payment.customers?.name ?? "cliente"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(payment.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      payment.status === "paid" ? "text-emerald-600" : "text-amber-600",
                    )}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
