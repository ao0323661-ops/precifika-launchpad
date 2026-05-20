import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  CreditCard,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/subscriptions")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw { redirect: "/login" };
    return { session };
  },
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        customers (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar assinaturas");
    else setSubscriptions(data || []);
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assinaturas</h2>
            <p className="text-slate-500 text-sm">Controle de planos e recorrência.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Assinatura
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Taxa de Renovação</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">94.2%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Churn Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">2.4%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">MRR</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">R$ 12.800</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Plano</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Próximo Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Carregando...</td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                      Nenhuma assinatura ativa encontrada.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{sub.customers?.name}</div>
                        <div className="text-xs text-slate-500">{sub.customers?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {sub.plan_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        R$ {Number(sub.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                          sub.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          sub.status === 'canceled' ? 'bg-rose-50 text-rose-600' :
                          sub.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {sub.status === 'active' ? 'Ativo' : 
                           sub.status === 'pending' ? 'Pendente' :
                           sub.status === 'canceled' ? 'Cancelado' :
                           sub.status === 'expired' ? 'Expirado' : sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
