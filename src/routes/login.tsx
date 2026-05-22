import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { toHashRoute } from "@/lib/hash-routes";
import { getPostAuthRedirect, withPostAuthRedirect } from "@/lib/post-auth-redirect";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState<"login" | "demo" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const postAuthRedirect = getPostAuthRedirect(location.searchStr);
  const loading = loadingAction !== null;

  const getLoginErrorMessage = (message?: string) => {
    const normalized = message?.toLowerCase() ?? "";

    if (normalized.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos. Revise os dados e tente novamente.";
    }

    if (normalized.includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar no Precifika.";
    }

    return "Não foi possível entrar agora. Tente novamente em instantes.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoadingAction("login");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(getLoginErrorMessage(error.message));
      } else if (!data.session) {
        toast.error("Não foi possível validar sua sessão. Entre novamente para continuar.");
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (sessionError) {
            toast.error("Não foi possível salvar sua sessão. Tente entrar novamente.");
            return;
          }
        }

        toast.success("Login realizado com sucesso.");
        await navigate({ to: postAuthRedirect });
      }
    } catch {
      toast.error("Não foi possível entrar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDemoLogin = async () => {
    setLoadingAction("demo");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      toast.success("Ambiente de demonstração carregado com dados fictícios.");
      window.location.assign(toHashRoute("/dashboard?demo=1"));
    } catch {
      toast.error("Não foi possível acessar a demonstração agora. Verifique sua conexão.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_480px]">
      <section className="hidden border-r border-border/70 bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Precifika</span>
        </a>

        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-glow">
            Gestão de preços
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Entre para acompanhar margens, simulações e oportunidades de preço.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Seu painel reúne dados comerciais, pagamentos e recomendações de precificação em uma
            experiência simples de operar.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <p className="text-sm text-slate-300">
            Ambiente seguro para contas reais. A demonstração usa dados fictícios.
          </p>
        </div>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <a href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Precifika</span>
          </a>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse sua conta para continuar no dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loadingAction === "login" && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingAction === "login" ? "Entrando..." : "Entrar"}
              {loadingAction !== "login" && <ArrowRight className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              {loadingAction === "demo" && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingAction === "demo" ? "Abrindo demonstração..." : "Ver demonstração"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <a
              href={toHashRoute(withPostAuthRedirect("/signup", postAuthRedirect))}
              className="font-medium text-primary hover:underline"
            >
              Começar teste grátis
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
