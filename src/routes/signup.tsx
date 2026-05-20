import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getSignupErrorMessage = (message?: string) => {
    const normalized = message?.toLowerCase() ?? "";

    if (normalized.includes("already registered") || normalized.includes("already exists")) {
      return "Este e-mail já tem uma conta. Entre para continuar ou use outro e-mail.";
    }

    if (normalized.includes("password")) {
      return "A senha informada não atende aos requisitos. Use pelo menos 6 caracteres.";
    }

    return "Não foi possível criar sua conta agora. Tente novamente em instantes.";
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(getSignupErrorMessage(error.message));
      } else {
        toast.success("Conta criada. Verifique seu e-mail para confirmar o acesso.");
        await navigate({ to: "/login" });
      }
    } catch {
      toast.error("Não foi possível criar sua conta agora. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_520px]">
      <section className="hidden border-r border-border/70 bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Precifika</span>
        </a>

        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-glow">
            Teste gratuito
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Comece a precificar com mais margem antes de assumir qualquer compromisso.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            O trial libera o dashboard para você organizar custos, revisar preços e entender onde
            seu negócio pode ganhar rentabilidade.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-slate-300">
          {[
            "14 dias grátis para explorar o Precifika.",
            "Não pedimos cartão de crédito no cadastro.",
            "Você decide o plano somente quando quiser continuar.",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span>{item}</span>
            </div>
          ))}
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
            <h2 className="text-3xl font-bold tracking-tight">Começar teste grátis</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie sua conta para iniciar o trial de 14 dias. Sem cartão de crédito.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Seu teste inclui acesso ao dashboard, dados reais da sua conta e opção de renovação na
            tela de planos quando o período terminar.
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
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
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Criando conta..." : "Criar conta e iniciar teste grátis"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
