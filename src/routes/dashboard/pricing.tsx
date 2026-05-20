import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pricing")({
  component: () => <div>Planos</div>,
});
