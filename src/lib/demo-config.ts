export const DEMO_USER = {
  email: "demo@precifika.com",
  password: "demo123",
};

export const DEMO_BADGE_LABEL = "Ambiente de demonstração";

export const isDemoUser = (email?: string) => email === DEMO_USER.email;

export const MOCK_DASHBOARD_STATS = [
  {
    label: "Receita simulada",
    value: "R$ 84.720,00",
    change: "+18,4%",
    helper: "últimos 30 dias",
    color: "text-emerald-700",
  },
  {
    label: "Margem média",
    value: "37,8%",
    change: "+3,2 p.p.",
    helper: "após custos e impostos",
    color: "text-emerald-700",
  },
  {
    label: "Produtos analisados",
    value: "246",
    change: "32 críticos",
    helper: "com preço revisado",
    color: "text-amber-700",
  },
  {
    label: "Oportunidade mensal",
    value: "R$ 12.940,00",
    change: "+15,3%",
    helper: "ganho potencial",
    color: "text-primary",
  },
];

export const MOCK_DEMO_PRODUCTS = [
  {
    name: "Linha Essencial 500g",
    category: "Alimentos",
    currentPrice: "R$ 28,90",
    suggestedPrice: "R$ 31,40",
    margin: "34%",
    status: "Reajuste recomendado",
  },
  {
    name: "Kit Profissional Premium",
    category: "Cosméticos",
    currentPrice: "R$ 149,00",
    suggestedPrice: "R$ 149,00",
    margin: "42%",
    status: "Preço saudável",
  },
  {
    name: "Reposição Técnica P12",
    category: "Indústria",
    currentPrice: "R$ 87,50",
    suggestedPrice: "R$ 94,20",
    margin: "29%",
    status: "Margem pressionada",
  },
];

export const MOCK_DEMO_INSIGHTS = [
  "Revisar 32 SKUs com margem abaixo de 25% antes da próxima campanha.",
  "A categoria Cosméticos sustenta a melhor margem e pode receber mais verba de mídia.",
  "O reajuste sugerido preserva competitividade e adiciona R$ 12.940,00 ao mês.",
];

export const MOCK_PAYMENTS = [
  {
    id: "demo-1",
    amount: 1490.9,
    status: "paid",
    payment_method: "pix",
    created_at: new Date().toISOString(),
    customers: { name: "Clínica Aurora", email: "financeiro@clinicaaurora.com.br" },
  },
  {
    id: "demo-2",
    amount: 3290.0,
    status: "paid",
    payment_method: "card",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    customers: { name: "Boreal Foods", email: "contas@borealfoods.com.br" },
  },
  {
    id: "demo-3",
    amount: 870.0,
    status: "pending",
    payment_method: "boleto",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    customers: { name: "Ateliê Nobre", email: "admin@atelienobre.com.br" },
  },
];
