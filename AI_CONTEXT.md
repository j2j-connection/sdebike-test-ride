SDEBIKE Test Ride – Codebase Context for AI Agents

This document explains the architecture, data model, and key files so an AI agent can work effectively.

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (via @tailwindcss/postcss)
- **Backend**: Supabase JS v2 (Postgres + Storage)
- **Payments**: Stripe Payment Intents + Stripe Elements
- **Digital Wallets**: Apple Pay, Google Pay (production-ready)
- **Code Quality**: ESLint, TypeScript

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe (CRITICAL for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 🚀 RUNNING THE APPLICATION

```bash
npm install
npm run dev  # Next.js may use 3001 if 3000 is busy
```

**Important**: The app runs on HTTP in development, which means:
- ✅ Credit card payments work perfectly
- ❌ Apple Pay/Google Pay won't work (requires HTTPS)
- ✅ All payment methods work in production with HTTPS

## 🛣️ APPLICATION ROUTES

- **`/`** → `src/app/page.tsx` → `TestDriveWidget` (main flow)
- **`/admin`** → `src/app/admin/page.tsx` (desktop admin dashboard)
- **`/test-ride-success`** → Success confirmation page
- **`/api/create-payment-intent`** → Stripe Payment Intent creation

## 💳 PAYMENT INTEGRATION ARCHITECTURE

### Stripe Implementation Details

#### 1. **Payment Intent Creation** (`/api/create-payment-intent`)
- **Purpose**: Creates $1 authorization hold (not a charge)
- **Amount**: 100 cents ($1.00) - Stripe requires minimum 1 cent
- **Currency**: USD
- **Capture Method**: `manual` (authorization only)
- **Status Flow**: `requires_payment_method` → `requires_confirmation` → `requires_capture` (success)

#### 2. **Frontend Payment Flow** (`PaymentStep.tsx`)
```typescript
// Key configuration
const stripePromise = loadStripe('pk_test_...')

<Elements 
  key={clientSecret} // Prevents re-rendering issues
  stripe={stripePromise} 
  options={{
    clientSecret,
    appearance: { theme: 'stripe', variables: { colorPrimary: '#10b981' } },
    loader: 'auto'
  }}
>
```

#### 3. **Payment Element Configuration** (`PaymentForm.tsx`)
```typescript
<PaymentElement 
  options={{
    layout: "tabs",
    paymentMethodOrder: ["apple_pay", "google_pay", "card"],
    wallets: {
      applePay: "auto",
      googlePay: "auto",
    },
    defaultValues: {
      billingDetails: {
        name: userName,
        email: userEmail
      }
    }
  }}
/>
```

### Digital Wallet Support

#### **Apple Pay & Google Pay**
- **Development**: Won't work (HTTP localhost + no domain verification)
- **Production**: Will work perfectly with:
  - HTTPS domain
  - Stripe domain verification
  - User's device wallet configured

#### **Payment Method Order**
1. **Apple Pay** (first priority)
2. **Google Pay** (second priority)  
3. **Credit Card** (fallback)

#### **Excluded Payment Methods**
- ❌ Klarna
- ❌ Amazon Pay
- ❌ CashApp
- ❌ Link

## 🔄 CUSTOMER FLOW (TestDriveWidget)

### Step-by-Step Process
1. **ContactStep**: name, phone, optional email
2. **BikeSelectionStep**: pick brand (Rad Power Bikes, Aventon, Other)
3. **VerificationStep**:
   - Upload photo ID to Supabase Storage (`customer-files/id-photos/...`)
   - Read Waiver opens a modal; user must agree
   - Signature captured on canvas → data URL
   - Waiver PNG generated and uploaded to Storage (`customer-files/waivers/<timestamp>.png`)
4. **PaymentStep**: ⭐ **NEW** - Stripe payment authorization
   - Creates $1 authorization hold
   - Supports Apple Pay, Google Pay, Credit Cards
   - Updates customer record with payment details
5. **ConfirmationStep**: shows brand, duration, return time
6. **SuccessScreen**: completion confirmation

### Payment Data Flow
```typescript
// Payment success updates customer record
onUpdate({ 
  payment_intent_id: paymentIntent.id, 
  payment_status: 'completed' 
})
```

## 🗄️ DATABASE SCHEMA

### Enhanced Customer Table
```sql
customers (
  -- ... existing fields ...
  payment_intent_id VARCHAR,     -- Stripe Payment Intent ID
  payment_status VARCHAR DEFAULT 'pending'  -- 'pending', 'completed', 'failed'
)
```

### Payment Status Values
- **`pending`**: Default state, no payment attempted
- **`completed`**: $1 authorization successful
- **`failed`**: Payment failed or declined

## 🔧 KEY TECHNICAL IMPLEMENTATIONS

### 1. **Stripe Elements Key Management**
```typescript
// CRITICAL: Prevent clientSecret re-rendering issues
<Elements key={clientSecret} ...>
```

### 2. **Payment Status Handling**
```typescript
// Handle all Stripe payment intent statuses
switch (paymentIntent.status) {
  case 'succeeded':
  case 'requires_capture':  // ✅ Authorization successful
    onSuccess(paymentIntent)
    break
  case 'processing':
    // Wait for confirmation
    break
  case 'canceled':
    onError('Payment was canceled')
    break
  default:
    onError('Unexpected payment status')
}
```

### 3. **Error Handling**
```typescript
// Specific error messages for different failure types
if (confirmError.type === 'card_error') {
  setError('Your card was declined. Please try another card.')
} else if (confirmError.type === 'validation_error') {
  setError('Please check your card details and try again.')
} else if (confirmError.type === 'invalid_request_error') {
  setError('Payment request invalid. Please try again.')
}
```

## 🚨 COMMON ISSUES & SOLUTIONS

### 1. **"Unsupported prop change: options.clientSecret"**
- **Cause**: Elements component re-rendering with different clientSecret
- **Solution**: Add `key={clientSecret}` to Elements component

### 2. **Apple Pay/Google Pay Not Working**
- **Development**: Expected behavior (HTTP + no domain verification)
- **Production**: Will work with HTTPS + Stripe domain verification

### 3. **Payment Processing Errors**
- **Check**: Payment intent status handling
- **Verify**: `requires_capture` is treated as success (authorization)

### 4. **Environment Variable Issues**
- **Problem**: Line breaks in `.env.local` keys
- **Solution**: Ensure keys are on single lines with no line breaks

## 🧪 TESTING STRATEGY

### Stripe Test Cards
```typescript
// Success scenarios
'4242424242424242'  // Visa (success)
'4000002500003155' // 3D Secure required

// Decline scenarios  
'4000000000000002' // Declined
'4000000000009995' // Insufficient funds
```

### Automated Testing
- **`qa/stripe-payment-test.js`**: Payment intent creation tests
- **`qa/payment-flow-test.js`**: End-to-end payment flow
- **`qa/frontend-payment-test.js`**: Frontend rendering tests

## 🔒 SECURITY CONSIDERATIONS

### Row Level Security (RLS)
- **Customers**: Public insert, authenticated read/update
- **Test Drives**: Public insert, authenticated read/update
- **Payments**: Stripe handles sensitive payment data

### Payment Security
- **No card data stored**: Only Stripe Payment Intent IDs
- **Server-side validation**: All payment intents created server-side
- **HTTPS required**: For production digital wallet support

## 📱 SMS INTEGRATION

### Provider-Agnostic SMS Service
The application uses a flexible SMS service that can switch between providers:

#### **TextBelt Provider (Development)**
- **Purpose**: Development and testing SMS functionality
- **Configuration**: `TEXTBELT_API_KEY` in environment
- **Cost**: Free tier available for testing
- **Features**: Simple REST API, no account setup required

#### **Twilio Provider (Production)**
- **Purpose**: Production SMS delivery
- **Configuration**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Features**: Professional SMS delivery, delivery receipts, webhooks

### Environment Variables
```bash
# SMS Provider Selection
SMS_PROVIDER=textbelt  # 'textbelt' | 'twilio'

# TextBelt Configuration
TEXTBELT_API_KEY=your_textbelt_api_key

# Twilio Configuration (when ready)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### SMS Service Usage
```typescript
import { smsService } from '@/lib/services/smsService'

// Send test ride confirmation
const result = await smsService.sendTestRideConfirmation(
  customer.phone,
  returnTime
)

// Check provider status
const provider = smsService.getCurrentProvider()
const configured = smsService.isConfigured()
```

### Switching Providers
```typescript
// Switch to Twilio when ready
smsService.setProvider('twilio')

// Or set environment variable
process.env.SMS_PROVIDER = 'twilio'
```

### Testing SMS Integration
```bash
# Test TextBelt integration
node test-textbelt.js

# Test with specific provider
SMS_PROVIDER=textbelt node test-textbelt.js
```

## 🚀 PRODUCTION DEPLOYMENT

### Requirements
1. **HTTPS domain** (required for Apple Pay/Google Pay)
2. **Stripe domain verification** (for digital wallets)
3. **Environment variables** properly set
4. **Database migrations** applied

### Environment Setup
```bash
# Production .env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

## 📁 KEY FILES & COMPONENTS

### Payment Components
- **`src/components/PaymentStep.tsx`**: Payment step wrapper with Stripe Elements
- **`src/components/PaymentForm.tsx`**: Stripe Payment Element + form logic
- **`src/app/api/create-payment-intent/route.ts`**: Payment intent creation API

### Core Components
- **`src/components/TestDriveWidget.tsx`**: Flow orchestrator (updated for payments)
- **`src/components/steps/*`**: Individual step components
- **`src/lib/services/testDriveService.ts`**: Database operations
- **`src/lib/supabase.ts`**: Supabase client + shared types

### Admin & Success
- **`src/app/admin/page.tsx`**: Admin dashboard (shows payment status)
- **`src/app/test-ride-success/page.tsx`**: Success confirmation page

## 🔄 EXTENDING THE SYSTEM

### Adding New Payment Methods
1. **Update PaymentElement options** in `PaymentForm.tsx`
2. **Add to paymentMethodOrder array**
3. **Test with Stripe test cards**

### Adding New Steps
1. **Create component** in `src/components/steps/`
2. **Add to STEPS array** in `TestDriveWidget.tsx`
3. **Update form data interface** if needed

### Database Changes
1. **Update schema** in `supabase-schema.sql`
2. **Run migrations** on Supabase
3. **Update TypeScript interfaces** in `supabase.ts`

## 📚 ADDITIONAL RESOURCES

- **Stripe Documentation**: https://stripe.com/docs
- **Apple Pay Setup**: https://stripe.com/docs/payments/apple-pay
- **Google Pay Setup**: https://stripe.com/docs/payments/google-pay
- **Supabase Documentation**: https://supabase.com/docs

## 🔄 RECENT UPDATES & CURRENT STATUS

### Latest Changes (Latest Deployment)
- **Payment Form Cleanup**: Removed all manual payment method descriptions and security text
- **Clean UI**: Payment form now uses only Stripe's native UI components
- **Professional Appearance**: Streamlined, modern payment experience

### Current Production Deployment
- **Vercel URL**: https://sdebike-test-ride-r6p9s5bdb-j2-j.vercel.app
- **Status**: ✅ Live and fully functional
- **Payment Methods**: 
  - ✅ Credit Cards (working perfectly)
  - ✅ Apple Pay (working - domain verified)
  - ✅ Google Pay (working - domain verified)

### Domain Verification Status
- **Apple Pay**: ✅ Verified and working
- **Google Pay**: ✅ Verified and working
- **Important**: No need to re-verify for new Vercel deployments
- **All subdomains** of verified domains work automatically

### Recent Fixes Applied
1. **Payment Form Rendering**: Fixed Stripe Elements context and clientSecret handling
2. **Payment Status Flow**: Proper handling of `requires_capture` status
3. **UI Cleanup**: Removed redundant text and manual payment descriptions
4. **Error Handling**: Improved payment error messages and user feedback

---

**Note for AI Assistants**: This framework is production-ready with comprehensive Stripe integration. The payment flow handles authorization holds (not charges), supports digital wallets, and includes robust error handling. All console warnings about Apple Pay/Google Pay not working in development are expected behavior.

