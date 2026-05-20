import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER } from "@/lib/demo-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "Erro ao entrar.");
      } else {
        toast.success("Bem-vindo!");
        navigate({ to: "/dashboard" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_USER.email);
    setPassword(DEMO_USER.password);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(DEMO_USER);
      if (error) {
        toast.error("Erro ao acessar modo demonstração.");
      } else {
        toast.success("Acessando Modo Demonstração");
        navigate({ to: "/dashboard" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Entrar no Precifika</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesse o seu painel</p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50" 
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Acessar Modo Demonstração
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <a href="/signup" className="font-medium text-primary hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
