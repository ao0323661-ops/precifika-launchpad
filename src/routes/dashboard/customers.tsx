import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/customers")({
  component: () => <div>Clientes</div>,
});
