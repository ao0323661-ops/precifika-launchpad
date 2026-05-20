import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/subscriptions")({
  component: () => <div>Assinaturas</div>,
});
