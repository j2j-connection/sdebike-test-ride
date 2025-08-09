# SDEBIKE Test Ride - QA Plan

## Scope
- Customer widget: contact → bike selection → verification (ID upload, waiver read + signature, waiver PNG upload) → confirmation → completion
- Admin dashboard: active rides grid, ID image, signature preview, waiver link, complete ride
- Supabase: RLS for anonymous inserts; staff full access; storage bucket `customer-files` MIME and public policies

## Environments
- Local: Next.js dev server on :3000/3001
- Supabase: URL and anon key provided via `.env.local`

## Setup
- npm install
- npm run dev
- If Supabase keys missing, tests run with storage and DB network stubs; no writes performed

## Test Strategy
- Playwright E2E specs for happy path, validations, security smoke, offline retry
- Lighthouse performance and PWA checks for `/` and `/admin`
- Axe accessibility audit

## Data Seeding
- If database is writable: run `node setup-database.js`, then `ts-node qa/seed.ts`

## Exit Criteria (Store-ready)
- No High/Critical bugs open
- Happy path green across Chromium/Firefox/WebKit and mobile viewports
- RLS verified: anonymous inserts only; no unauthorized reads
- Performance: TTI under ~2s on 4G throttling; submit <800ms median
- Accessibility: WCAG 2.2 AA baseline (no critical axe violations)