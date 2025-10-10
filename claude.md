# SD Electric Bike Test Ride & Rental Application - Claude Context

## Project Overview
Next.js 15 application for managing electric bike test rides AND hourly rentals, replacing paper-based processes with digital workflows including ID capture, digital waivers, and Stripe payments (authorization for test rides, full payment for rentals).

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
- **Stripe**:
  - Test Rides: $1 authorization holds (manual capture)
  - Rentals: Full payment upfront (automatic capture)
  - Apple Pay, Google Pay support
- **Supabase**: Customer data, ID photos, signed waivers with RLS
- **SMS Service**: Flexible provider system (TextBelt primary, Twilio fallback)
- **Google Analytics**: GA4 tracking with custom events for test drive funnel

## Important Files
### Customer Workflows
- `src/components/LandingChoice.tsx` - Landing page with Test Ride vs Rental choice
- `src/components/TestDriveWidget.tsx` - Test ride customer flow
- `src/components/RentalWidget.tsx` - Rental customer flow
- `src/components/steps/RentalSelectionStep.tsx` - Rental bike & duration selection
- `src/components/steps/RentalPaymentStep.tsx` - Rental full payment
- `src/components/steps/RentalConfirmationStep.tsx` - Rental confirmation

### Core Services
- `src/config/rental-pricing.ts` - Rental pricing configuration
- `src/config/features.ts` - Feature flags for rental vs test ride
- `src/lib/services/testDriveService.ts` - Test drive & rental creation
- `src/lib/services/smsService.ts` - SMS provider management
- `src/lib/analytics.ts` - Google Analytics tracking utilities
- `src/app/api/create-payment-intent/route.ts` - Stripe API (handles both types)

### Database
- `supabase-schema.sql` - Original database structure
- `supabase-rental-migration.sql` - Rental feature migration (NEW)

## Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# SMS Services
TEXTBELT_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Feature Flags (NEW)
NEXT_PUBLIC_SHOW_RENTAL_CHOICE=true          # Show landing page choice
NEXT_PUBLIC_ENABLE_RENTALS=true              # Enable rental workflow
NEXT_PUBLIC_ENABLE_TEST_RIDES=true           # Enable test ride workflow
NEXT_PUBLIC_SHOP_NAME=SD Electric Bike       # Shop display name
NEXT_PUBLIC_SHOP_SLUG=sd-electric-bike       # Shop URL slug
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

## Google Analytics Events Implemented
### Customer Journey Tracking
- `analytics.trackFormStart()` - Customer begins signup process
- `analytics.trackIdUploaded()` - ID verification completed
- `analytics.trackWaiverSigned()` - Digital waiver signed
- `analytics.trackPaymentAuthorized()` - $1 Stripe authorization successful
- `analytics.trackTestDriveCompleted()` - Full customer journey completed

### Admin Activity Tracking
- `analytics.trackAdminLogin()` - Admin dashboard access (ACTIVE)
- `analytics.trackCustomerDataViewed()` - Admin opens customer waivers (ACTIVE)

### Error Monitoring
- `analytics.trackError(error, context)` - System debugging and issue tracking

### Event Categories
- `test_drive` - Customer conversion funnel analysis
- `admin` - Staff activity monitoring
- `error` - System health tracking

## Rental Feature Details (NEW - 2025-10-06)

### Rental Workflow
1. **Landing Page** (`/`): Customer chooses "Test Ride" or "Rental"
   - Can be disabled via feature flag to route directly
2. **Test Ride Route** (`/test-ride`): Existing 30-min flow with $1 hold
3. **Rental Route** (`/rental`): New hourly rental flow

### Rental Pricing
- **Luxury E-Bike**: $35/hr, $70/2hrs
- **E-Bike**: $25/hr, $50/2hrs
- **E-Scooter**: $25/hr, $50/2hrs

### Database Changes
- Added `rental_type` field: 'test_ride' | 'rental'
- Added `rental_duration`: 1 | 2 hours
- Added `rental_price`: decimal
- Added `expected_return_time`: timestamp
- Added `bike_category`: 'luxury_ebike' | 'ebike' | 'escooter'
- Created `payments` table for tracking
- Created views: `bike_availability`, `active_rentals`

### Payment Handling
- **Test Rides**: $1 authorization with manual capture
- **Rentals**: Full payment with automatic capture
- Both use Stripe Payment Intents with same API endpoint

### Routes
- `/` - Landing choice page (or redirect based on feature flags)
- `/test-ride` - Test ride workflow
- `/rental` - Rental workflow
- `/shop/[slug]` - Shop-specific pages

### Admin Features (TODO)
- View active rentals
- Mark bikes as returned
- Track overdue rentals
- Real-time inventory availability

## Changelog
- 2025-10-06: **MAJOR FEATURE**: Added complete rental workflow with hourly pricing, full payment, duration selection, and feature flags
- 2025-10-06: Created rental-specific components: RentalWidget, RentalSelectionStep, RentalPaymentStep, RentalConfirmationStep
- 2025-10-06: Updated payment API to handle both authorization (test rides) and charges (rentals)
- 2025-10-06: Added landing page with "Test Ride vs Rental" choice (configurable via feature flags)
- 2025-10-06: Created database migration for rental support (supabase-rental-migration.sql)
- 2025-09-14: Added comprehensive Google Analytics GA4 tracking with custom events for test drive funnel
- 2025-09-14: Removed complete button from admin for 2-year data retention compliance
- 2025-08-29: RESOLVED Stripe production issue - replaced SDK with direct API calls
- 2025-08-29: Added webhook endpoint and comprehensive network testing
- 2025-08-29: Updated environment variables and troubleshooting documentation
- 2025-08-23: Created initial claude.md with project context and resolved integration status