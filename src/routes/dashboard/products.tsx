import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";

export const Route = createFileRoute("/dashboard/products")({
  component: Products,
});

function Products() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Produtos</h2>
      <p className="text-muted-foreground text-sm">Gerencie seus produtos e precificação.</p>
    </div>
  );
}
