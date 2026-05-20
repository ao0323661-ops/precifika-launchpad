import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { 
  BarChart3,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/payments")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw { redirect: "/login" };
    return { session };
  },
  component: PaymentsPage,
});

function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        customers (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar pagamentos");
    else setPayments(data || []);
    setLoading(false);
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'refunded': return <XCircle className="h-4 w-4 text-slate-400" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'failed': return 'Falhou';
      case 'refunded': return 'Reembolsado';
      default: return 'Pendente';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pagamentos</h2>
            <p className="text-slate-500 text-sm">Histórico financeiro e transações.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Transação</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Método</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Carregando...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                      Nenhum pagamento registrado ainda.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        #{p.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{p.customers?.name}</div>
                        <div className="text-[10px] text-slate-400">{p.customers?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        R$ {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {getStatusIcon(p.status)}
                          {getStatusLabel(p.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 capitalize">
                        {p.payment_method || 'Cartão'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(p.created_at).toLocaleString()}
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
