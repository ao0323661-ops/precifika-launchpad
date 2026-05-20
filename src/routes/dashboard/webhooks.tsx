import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/webhooks")({
  component: () => <div>Webhooks</div>,
});
