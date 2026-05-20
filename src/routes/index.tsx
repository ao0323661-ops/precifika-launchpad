import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Check,
  TrendingUp,
  Calculator,
  BarChart3,
  Sparkles,
  Zap,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Precifika — Precificação inteligente para o seu negócio" },
      {
        name: "description",
        content:
          "Precifika é o SaaS que ajuda você a calcular preços lucrativos, analisar margens e crescer com confiança.",
      },
      { property: "og:title", content: "Precifika — Precificação inteligente" },
      {
        property: "og:description",
        content:
          "Calcule preços lucrativos, analise margens e escale seu negócio com a Precifika.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header open={open} setOpen={setOpen} />
      <main>
        <Hero />
        <Benefits />
        <Plans />
      </main>
      <Footer />
    </div>
  );
}

function Header({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const links = [
    { label: "Benefícios", href: "#beneficios" },
    { label: "Planos", href: "#planos" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-lg shadow-primary/30">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Precifika</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm">Entrar</Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow shadow-md shadow-primary/25 hover:opacity-90">
            Cadastrar
          </Button>
        </div>
        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm">Entrar</Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-primary-glow/15 to-transparent blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Precificação inteligente para o seu negócio
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Calcule preços que{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              geram lucro
            </span>{" "}
            de verdade.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Precifika é a plataforma que ajuda empreendedores e indústrias a
            precificar com clareza, analisar margens e tomar decisões com
            confiança.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary-glow shadow-lg shadow-primary/30 hover:opacity-90 sm:w-auto"
            >
              Começar grátis
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Ver demonstração
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14 dias grátis. Sem cartão de crédito.
          </p>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: Calculator,
      title: "Precificação precisa",
      desc: "Defina preços com base em custos reais, margens e impostos — sem planilhas confusas.",
    },
    {
      icon: BarChart3,
      title: "Análises em tempo real",
      desc: "Acompanhe lucratividade por produto, categoria e canal com dashboards claros.",
    },
    {
      icon: TrendingUp,
      title: "Decisões com confiança",
      desc: "Simule cenários e antecipe o impacto de mudanças antes de aplicá-las.",
    },
    {
      icon: Zap,
      title: "Rápido de configurar",
      desc: "Importe seus produtos e comece a precificar em minutos, não em semanas.",
    },
    {
      icon: ShieldCheck,
      title: "Seguro e confiável",
      desc: "Seus dados são criptografados e armazenados com os melhores padrões do mercado.",
    },
    {
      icon: Sparkles,
      title: "Sugestões inteligentes",
      desc: "Recomendações baseadas em IA para otimizar suas margens automaticamente.",
    },
  ];
  return (
    <section id="beneficios" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo o que você precisa para precificar bem
          </h2>
          <p className="mt-4 text-muted-foreground">
            Ferramentas pensadas para quem quer crescer com lucro — não na sorte.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const plans = [
    {
      name: "Starter",
      price: "R$ 49",
      desc: "Para quem está começando a profissionalizar a precificação.",
      features: [
        "Até 50 produtos",
        "Cálculo de margem e custo",
        "1 usuário",
        "Suporte por email",
      ],
      cta: "Começar grátis",
      highlight: false,
    },
    {
      name: "Pro",
      price: "R$ 149",
      desc: "Para negócios em crescimento que precisam de mais controle.",
      features: [
        "Produtos ilimitados",
        "Dashboards avançados",
        "Até 5 usuários",
        "Simulações de cenário",
        "Suporte prioritário",
      ],
      cta: "Assinar Pro",
      highlight: true,
    },
    {
      name: "Business",
      price: "R$ 399",
      desc: "Para indústrias e empresas com operações complexas.",
      features: [
        "Tudo do Pro",
        "Usuários ilimitados",
        "Integrações via API",
        "Gerente de conta dedicado",
        "SLA personalizado",
      ],
      cta: "Falar com vendas",
      highlight: false,
    },
  ];
  return (
    <section id="planos" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Planos para cada estágio
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comece grátis e evolua conforme seu negócio cresce.
          </p>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                p.highlight
                  ? "relative rounded-2xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/20"
                  : "relative rounded-2xl border border-border bg-card p-8"
              }
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                  Mais popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <Button
                className={
                  p.highlight
                    ? "mt-6 w-full bg-gradient-to-r from-primary to-primary-glow shadow-md shadow-primary/25 hover:opacity-90"
                    : "mt-6 w-full"
                }
                variant={p.highlight ? "default" : "outline"}
              >
                {p.cta}
              </Button>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">Precifika</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Precifika. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
