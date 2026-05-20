export const DEMO_USER = {
  email: "demo@precifika.com",
  password: "demo123",
};

export const isDemoUser = (email?: string) => email === DEMO_USER.email;

export const MOCK_PAYMENTS = [
  {
    id: "demo-1",
    amount: 149.90,
    status: "paid",
    payment_method: "pix",
    created_at: new Date().toISOString(),
    customers: { name: "Cliente Exemplo 1", email: "cliente1@exemplo.com" }
  },
  {
    id: "demo-2",
    amount: 299.00,
    status: "paid",
    payment_method: "card",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    customers: { name: "Cliente Exemplo 2", email: "cliente2@exemplo.com" }
  },
  {
    id: "demo-3",
    amount: 97.00,
    status: "pending",
    payment_method: "boleto",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    customers: { name: "Cliente Exemplo 3", email: "cliente3@exemplo.com" }
  }
];
