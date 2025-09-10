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
- **Google Analytics**: GA4 tracking with custom events for test drive funnel

## Important Files
- `src/components/TestDriveWidget.tsx` - Main customer flow
- `src/components/PaymentForm.tsx` - Stripe integration
- `src/lib/services/smsService.ts` - SMS provider management
- `src/lib/analytics.ts` - Google Analytics tracking utilities
- `src/app/api/create-payment-intent/route.ts` - Stripe API
- `supabase-schema.sql` - Database structure

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TEXTBELT_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Recent Issues Resolved
- Fixed Twilio import errors causing browser crashes
- Implemented flexible SMS service with TextBelt primary, Twilio fallback
- Completed comprehensive QA testing with all payment flows working
- **RESOLVED**: Stripe production connectivity issue (Aug 29, 2025)

## Deployment Status
- **Live URL**: https://testr.j2j.info
- **Status**: ✅ Fully operational - all features working
- **Last Deploy**: Stripe payments fully functional in production

## Key Technical Solutions
- **Stripe Integration**: Use direct fetch API instead of Stripe SDK in Vercel serverless functions
- **Webhook Endpoint**: Required `/api/webhooks/stripe` endpoint with `STRIPE_WEBHOOK_SECRET`
- **Payment Processing**: Manual capture for $1 authorization holds

## Changelog
- 2025-08-29: RESOLVED Stripe production issue - replaced SDK with direct API calls
- 2025-08-29: Added webhook endpoint and comprehensive network testing
- 2025-08-29: Updated environment variables and troubleshooting documentation
- 2025-08-23: Created initial claude.md with project context and resolved integration status