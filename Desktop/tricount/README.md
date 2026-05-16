# MonBudget

Application de gestion budgétaire pour un couple. Suivi des dépenses, budgets mensuels, épargne partagée, répartition équitable.

## Stack

- **Next.js 16** · App Router · TypeScript strict
- **Supabase** · Auth magic link · Postgres · RLS · Realtime · Storage
- **TanStack Query** · cache client
- **Tailwind CSS** · shadcn/ui · Framer Motion · Recharts
- **PWA** · service worker · installable mobile

---

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com) (gratuit)

---

## Installation

```bash
git clone <repo>
cd tricount
npm install
cp .env.local.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Configuration Supabase

### 1. Créer un projet sur supabase.com

### 2. Appliquer les migrations (SQL Editor)

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
```

### 3. Auth → Settings

- **Site URL** : `http://localhost:3000`
- **Redirect URLs** : `http://localhost:3000/auth/callback`

### 4. Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Commandes

```bash
npm run dev       # Développement → http://localhost:3000
npm run build     # Build de production
npm run lint      # ESLint
```

---

## Déploiement Vercel

1. Push sur GitHub → importer dans Vercel
2. Ajouter les variables d'environnement
3. Mettre à jour `NEXT_PUBLIC_APP_URL` et les Redirect URLs Supabase

---

## Structure

```
app/
  (auth)/          → /login, /onboarding
  (app)/           → Dashboard, Dépenses, Budget, Historique, Épargne, Tendances, Couple, Paramètres
  auth/callback/   → callback magic link
  invite/[token]/  → acceptation invitation

components/        → BudgetGauge, ExpenseCard, MemberAvatar, PotCard, MonthPicker...
lib/
  supabase/        → client, server, middleware, types
  queries/         → hooks TanStack Query
  utils/           → calculs financiers, formatage
supabase/
  migrations/      → 001_schema.sql, 002_rls.sql
public/
  manifest.json   → PWA
  icons/          → icônes 192, 512, maskable
```
