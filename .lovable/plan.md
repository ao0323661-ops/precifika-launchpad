### Plano de Estrutura do Precifika SaaS

1. **Dashboard & Auth Protection**
   - Criar `src/routes/dashboard.tsx` com `requireSupabaseAuth`.
   - Implementar `src/integrations/supabase/auth-attacher.ts` e registrar no `src/start.ts`.
   - Criar `src/components/ProtectedRoute.tsx` para garantir redirecionamento.

2. **UI Componentes de Auth**
   - Criar página de Login (`src/routes/login.tsx`).
   - Criar página de Cadastro (`src/routes/signup.tsx`).
   - Criar página de verificação/recuperação (`src/routes/auth/verify.tsx` e `src/routes/auth/recovery.tsx`).

3. **Dashboard UI**
   - Criar layout do dashboard com sidebar/navbar.
   - Implementar visualização básica de assinaturas e clientes.

4. **Verificação de E-mail**
   - Configurar flow de e-mail automático.

### Detalhes técnicos
- Usar `TanStack Router` para o roteamento e `Supabase SDK` para o estado de sessão.
- Proteger o `/dashboard` com `middleware`.
- Garantir que o `logout` limpe as sessões.
- Usar `useAuth` criado para gerenciar o estado global de auth.