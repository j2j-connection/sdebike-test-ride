SDEBIKE Test Ride – Codebase Context for AI Agents

This document explains the architecture, data model, and key files so an AI agent can work effectively.

Stack
- Next.js 15 (App Router), React 19
- Tailwind CSS v4 (via @tailwindcss/postcss)
- Supabase JS v2 (Postgres + Storage)
- TypeScript, ESLint

Env
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Run
- npm install
- npm run dev (Next may use 3001 if 3000 is busy)

Routes
- / → src/app/page.tsx → TestDriveWidget
- /admin → src/app/admin/page.tsx (desktop admin dashboard)

Customer flow (TestDriveWidget)
1. ContactStep: name, phone, optional email
2. BikeSelectionStep: pick brand (Rad Power Bikes, Aventon, Other)
3. VerificationStep:
   - Upload photo ID to Supabase Storage (customer-files/id-photos/...)
   - Read Waiver opens a modal; user must agree
   - Signature captured on canvas → data URL
   - Waiver PNG generated on a hidden canvas (text + signature) and uploaded to Storage (customer-files/waivers/<timestamp>.png); public URL saved as waiver_url
4. ConfirmationStep: shows brand, 10-minute duration, and return time; completing persists to DB

Data layer (src/lib/services/testDriveService.ts)
- createTestDrive: insert customer (including waiver_url when present) then insert test_drives; best‑effort waiver_url update retained
- getActiveTestDrives: select active test_drives joined with customers (explicit fields incl. waiver_url, submission_ip, submitted_at)
- completeTestDrive: mark a test drive completed

Database (see supabase-schema.sql)
- customers: name, phone, email, id_photo_url, signature_data, waiver_url, waiver_signed, submission_ip, submitted_at, created_at, updated_at
- test_drives: customer_id, bike_model, start_time, end_time, status, created_at, updated_at
- notifications: audit of outbound messages
RLS policies allow public inserts for customer/test_drives; staff have full access when authenticated.

Admin (src/app/admin/page.tsx)
- Card grid of active rides with: name, phone, start/end, ID image, signature preview, submitted_at, submission_ip, and Open Waiver button when waiver_url exists

Styling/UX
- Tailwind utility classes; admin signature previews constrained with object-contain + max width
- Header logo is /public/logo.png (fallback to /file.svg if invalid)

Extending
- Prefer storing metadata on customers
- Ensure Storage MIME types permit any new uploads
- For IP capture, add a Next API route to return request IP and set customers.submission_ip
- For realtime admin, use Supabase Realtime on test_drives/customers

Key files
- src/components/TestDriveWidget.tsx (flow orchestrator)
- src/components/steps/* (individual steps)
- src/lib/services/testDriveService.ts (DB ops)
- src/lib/supabase.ts (client + shared types)
- src/app/admin/page.tsx (admin UI)

