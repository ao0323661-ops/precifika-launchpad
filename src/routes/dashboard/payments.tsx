import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/payments")({
  component: () => <div>Pagamentos</div>,
});
