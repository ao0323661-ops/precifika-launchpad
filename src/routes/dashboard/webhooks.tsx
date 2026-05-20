import React from "react";
import type { Tables } from "@/integrations/supabase/types";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/webhooks")({
  component: WebhookLogsPage,
});

const dashboardRoute = getRouteApi("/dashboard");
type WebhookLog = Tables<"webhook_logs">;

function WebhookLogsPage() {
  const { session } = dashboardRoute.useRouteContext();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) toast.error("Erro ao carregar logs");
    else setLogs(data || []);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "duplicated":
        return <Clock className="h-4 w-4 text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "error":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "duplicated":
        return "bg-slate-50 text-slate-700 border-slate-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Logs de Webhook</h2>
          <p className="text-slate-500 text-sm">Monitore os eventos recebidos do Abacate Pay.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="gap-2">
          <History className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Evento
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Data
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                    Nenhum webhook recebido ainda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const status = log.status ?? "pending";

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{log.event_type}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            ID: {log.event_id || log.id.substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusClass(status)}`}
                          >
                            {getStatusIcon(status)}
                            {status.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {expandedId === log.id ? (
                            <ChevronUp className="h-4 w-4 ml-auto text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 ml-auto text-slate-400" />
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="space-y-4">
                              {log.error_message && (
                                <div className="rounded-md bg-rose-50 p-3 border border-rose-100">
                                  <p className="text-xs font-bold text-rose-800">Erro:</p>
                                  <p className="text-xs text-rose-700">{log.error_message}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Payload Completo
                                  </p>
                                  <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[10px] text-slate-300">
                                    {JSON.stringify(log.payload, null, 2)}
                                  </pre>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Metadados
                                  </p>
                                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Gateway:</span>
                                      <span className="font-medium text-slate-900">
                                        {log.gateway_provider}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Processado em:</span>
                                      <span className="font-medium text-slate-900">
                                        {log.processed_at
                                          ? new Date(log.processed_at).toLocaleString()
                                          : "-"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">User ID:</span>
                                      <span className="font-mono text-[10px] text-slate-600">
                                        {log.user_id || "Não identificado"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
