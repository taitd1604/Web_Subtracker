# Subtracker

Personal subscription tracker for single-user private usage.  
Built with Next.js App Router, TypeScript, Tailwind, shadcn-style UI components, Prisma, and PostgreSQL.

## Features

- Track subscriptions with `monthly/yearly + billingInterval`
- Support cost modes: `full`, `split`, `fixed`
- Calculate **my actual monthly cost** only
- Show one monthly total in `VND` (USD subscriptions are converted to VND)
- Reminder buckets: `overdue`, `due today`, `due tomorrow`
- Soft-delete via `archivedAt`
- Basic Auth protection via middleware (optional, env-based)

## Stack

- Next.js App Router + TypeScript
- TailwindCSS
- Prisma ORM + PostgreSQL
- `date-fns` for date logic

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Set exchange rate if needed:

```bash
USD_TO_VND_RATE=26000
```

3. Create database schema and client:

```bash
npx prisma migrate deploy
npx prisma generate
```

4. Run local:

```bash
npm run dev
```

## PR Review Workflow (No Need to Wait for Production Deploy)

This repo now includes:

- PR CI workflow: `.github/workflows/pr-ci.yml`
  - Runs on every PR to `main`
  - Checks: `lint`, `test --if-present`, `build`
- Vercel Preview workflow: `.github/workflows/vercel-preview.yml`
  - Deploys a preview build for each PR
  - Updates/creates a PR comment with preview URL
- PR template: `.github/pull_request_template.md`
  - Forces a consistent reviewer checklist

### One-time setup

1. Connect this GitHub repository to Vercel project.
2. In GitHub repository settings, add these Actions secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Ensure environment variables are set in Vercel (Preview + Production):
   - `DATABASE_URL`
   - `BASIC_AUTH_USERNAME`
   - `BASIC_AUTH_PASSWORD`

### Branch protection (required)

In GitHub `Settings -> Branches -> Branch protection rules` for `main`:

1. Require a pull request before merging.
2. Require approvals (recommended: at least 1).
3. Require status checks to pass before merging:
   - `PR CI / quality`
   - `Vercel Preview / deploy-preview`

### Daily flow

1. Create branch and push changes.
2. Open PR to `main`.
3. Wait for:
   - CI checks to pass.
   - Preview comment from Vercel workflow.
4. Review directly on preview URL.
5. Merge PR only when checks + review checklist are complete.
6. Production deploy happens after merge (not before review).

## Data Model

Main model: `Subscription` in `prisma/schema.prisma`.

Important fields:

- `totalAmount` / `fixedAmount` use `Decimal` (`DECIMAL(18,4)`) to avoid float precision issues
- `nextBillingDate` uses `DATE` semantics (`@db.Date`)
- `archivedAt` controls active/archived state

## Business Rules

- `full`: `myCost = totalAmount`
- `split`: `myCost = totalAmount * (myShare / splitTotalUsers)`
- `fixed`: `myCost = fixedAmount`
- Monthly normalized cost:
  `myMonthlyCost = myCost / intervalMonths`
  where `intervalMonths = billingInterval * (billingType === yearly ? 12 : 1)`

## Reminder Logic

Implemented in `lib/reminder.ts` with calendar-day comparison:

- `overdue` when `nextBillingDate < today`
- `today` when same date
- `tomorrow` when date is tomorrow

This logic is reusable for future cron/email jobs.

## Free Deploy (Simple)

Recommended:

- Next.js app: Vercel Hobby
- PostgreSQL: Supabase Free

Steps:

1. Push project to GitHub.
2. Create Supabase project and copy `DATABASE_URL`.
3. Import repo into Vercel, set environment variables:
   - `DATABASE_URL`
   - `BASIC_AUTH_USERNAME`
   - `BASIC_AUTH_PASSWORD`
4. Deploy.
5. Run migration once on production DB (`prisma migrate deploy`) in CI or build step.

## Project Structure

- `app/page.tsx`: dashboard (KPI, reminders, active list)
- `app/subscriptions/new/page.tsx`: create page
- `app/subscriptions/[id]/edit/page.tsx`: edit page
- `app/actions/subscriptions.ts`: server actions for CRUD and billing advance
- `lib/cost.ts`: cost calculations
- `lib/reminder.ts`: reminder buckets
- `lib/validation.ts`: form validation and payload parsing
- `middleware.ts`: Basic Auth guard
