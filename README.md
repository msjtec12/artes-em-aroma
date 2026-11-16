# Loja Artes em Aroma — Plataforma de Vitrine Digital, Gestão Comercial e Visibilidade em Buscas

Sistema comercial completo desenvolvido sob medida para a **Loja Artes em Aroma** (Suzano/SP), abrangendo vitrine pública com direção de arte botânica artesanal, sacola persistente com validação no servidor para pedidos via WhatsApp, painel administrativo completo e engenharia avançada de SEO Técnico, SEO Local, GEO e AEO.

## 1. Arquitetura Técnica e Stack

- **Framework:** Next.js 15 (App Router, Server Components, SSR e revalidação de rotas).
- **Linguagem:** TypeScript (`strict: true`).
- **Estilização & Identidade Visual:** Tailwind CSS com paleta oficial (`#F7F1E9`, `#A6AD89`, `#656C4A`, `#B59A73`, `#3D332B`, `#FFFCF8`) e tipografia Cormorant Garamond, DM Sans e Caveat.
- **Banco de Dados & ORM:** Neon PostgreSQL (`@neondatabase/serverless`) + Drizzle ORM (`drizzle-orm`), com fallback PostgreSQL embarcado persistente (`@electric-sql/pglite` em `./data/pglite`) quando `DATABASE_URL` não está apontado para nuvem externa.
- **Autenticação & Segurança:** Sessão JWT assinada com `jose` em cookie `httpOnly`, senhas com hash `bcryptjs`, proteção de rotas via `src/middleware.ts`, validação `zod` no servidor e rate limiting em memória (`src/lib/rate-limit.ts`).
- **Testes Automatizados:** Vitest (`src/__tests__/platform.test.ts`) cobrindo os 20 requisitos de teste.

## 2. Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Inicializar e popular o banco de dados (idempotente)
npm run db:seed

# 3. Executar a suíte de testes automatizados
npm test

# 4. Iniciar o servidor de desenvolvimento
npm run dev

# 5. Gerar build de produção
npm run build
```

## 3. Credenciais Administrativas Iniciais

- **URL do Painel:** `/admin` (ou `/admin/login`)
- **E-mail:** `admin@artesemaroma.com.br`
- **Senha:** `ArtesAroma@2026`

## 4. Backup e Restauração

- **Gerar backup completo em JSON:** `npm run db:backup` (ou diretamente pelo botão **"Gerar Backup Instantâneo JSON"** dentro de `/admin` → aba *Conteúdo, Loja & Backups*).
- **Validar/Restaurar backup:** `npm run db:restore`

## 5. Deploy na Vercel com Neon PostgreSQL

1. Crie um banco PostgreSQL no [Neon](https://neon.tech) e copie a string `DATABASE_URL`.
2. No painel do projeto na Vercel, configure as variáveis listadas em `.env.example`:
   - `DATABASE_URL`: String de conexão do Neon PostgreSQL.
   - `AUTH_SECRET`: Chave secreta aleatória de pelo menos 32 caracteres.
   - `NEXT_PUBLIC_SITE_URL`: Domínio canônico oficial (ex: `https://artesemaroma.com.br`).
3. Aplique a migration versionada em `drizzle/migrations/0000_initial_schema.sql` com `npm run db:push` ou `npm run db:seed`.
