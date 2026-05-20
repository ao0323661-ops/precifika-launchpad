import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { 
  Package,
  Plus,
  Tag,
  Clock,
  Trash2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/products")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw { redirect: "/login" };
    return { session };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar produtos");
    else setProducts(data || []);
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Produtos & Planos</h2>
            <p className="text-slate-500 text-sm">Configure suas ofertas e modelos de cobrança.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Produto
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center py-10 text-slate-500">Carregando...</p>
          ) : products.length === 0 ? (
            <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">Nenhum produto criado</h3>
              <p className="text-slate-500 mt-1 mb-6">Comece criando seu primeiro plano de assinatura ou produto digital.</p>
              <Button variant="outline">Criar meu primeiro produto</Button>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 text-slate-400 hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                    <button className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description || 'Sem descrição'}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">R$ {Number(product.price).toFixed(2)}</span>
                    <span className="text-slate-500 text-xs ml-1">
                      / {product.billing_period === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    Recorrente
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
