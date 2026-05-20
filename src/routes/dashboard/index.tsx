import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: () => (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bem-vindo ao Dashboard</h1>
      <p className="text-slate-600">Selecione uma opção no menu lateral.</p>
    </div>
  ),
});
