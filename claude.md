# SD Electric Bike Test Ride Application - Claude Context

## Project Overview
Next.js 15 application for managing electric bike test rides, replacing paper-based processes with digital workflows including ID capture, digital waivers, and Stripe payment authorization.

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint
- `node setup-database.js` - Initialize Supabase schema
- `node setup-storage.js` - Set up storage buckets
- `node qa/comprehensive-test.js` - Run QA tests

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Payments**: Stripe Payment Intents + Elements
- **Deployment**: Vercel (already connected)
- **SMS**: TextBelt + Twilio (flexible service)

## Key Integrations
- **Stripe**: $1 authorization holds, Apple Pay, Google Pay support
- **Supabase**: Customer data, ID photos, signed waivers with RLS
- **SMS Service**: Flexible provider system (TextBelt primary, Twilio fallback)

## Important Files
- `src/components/TestDriveWidget.tsx` - Main customer flow
- `src/components/PaymentForm.tsx` - Stripe integration
- `src/lib/services/smsService.ts` - SMS provider management
- `src/app/api/create-payment-intent/route.ts` - Stripe API
- `supabase-schema.sql` - Database structure

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
TEXTBELT_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

## Recent Issues Resolved
- Fixed Twilio import errors causing browser crashes
- Implemented flexible SMS service with TextBelt primary, Twilio fallback
- Completed comprehensive QA testing with all payment flows working

## Deployment Status
- **Live URL**: Connected to Vercel
- **Status**: ✅ Fully functional
- **Last Deploy**: All SMS and payment systems operational

## Changelog
- 2025-08-23: Created initial claude.md with project context and resolved integration status