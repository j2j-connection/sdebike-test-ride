# 🚀 Stripe Integration Quick Reference Guide

## 🎯 **What This Integration Does**
- **$1 Authorization Hold** (not a charge) for test ride verification
- **Apple Pay & Google Pay** support (production-ready)
- **Credit Card** fallback with full Stripe Elements
- **Secure payment processing** with no card data storage

## 🔑 **Critical Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Rvs8dA3dzhvH5fqqf7IbHqXBU0OOfc...
STRIPE_SECRET_KEY=sk_test_51Rvs8dA3dzhvH5fq2ex1AUMhyCuSVtH3uilr77rIJjqkWswpc...
```

**⚠️ CRITICAL**: No line breaks in these keys! Must be single lines.

## 🏗️ **Architecture Overview**

### 1. **Backend API** (`/api/create-payment-intent`)
```typescript
// Creates $1 authorization hold
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100, // $1.00 in cents
  currency: 'usd',
  capture_method: 'manual', // Authorization only
  metadata: { test_ride: 'true' }
})
```

### 2. **Frontend Payment Step** (`PaymentStep.tsx`)
```typescript
// Wraps PaymentForm with Stripe Elements
<Elements key={clientSecret} stripe={stripePromise}>
  <PaymentForm clientSecret={clientSecret} ... />
</Elements>
```

### 3. **Payment Form** (`PaymentForm.tsx`)
```typescript
// Stripe Payment Element with digital wallet support
<PaymentElement 
  options={{
    layout: "tabs",
    paymentMethodOrder: ["apple_pay", "google_pay", "card"],
    wallets: { applePay: "auto", googlePay: "auto" }
  }}
/>
```

## 📱 **Digital Wallet Support**

### **Development (localhost)**
- ❌ **Apple Pay**: Won't work (HTTP + no domain verification)
- ❌ **Google Pay**: Won't work (HTTP + no domain verification)
- ✅ **Credit Cards**: Work perfectly

### **Production (HTTPS + Domain Verification)**
- ✅ **Apple Pay**: Full support
- ✅ **Google Pay**: Full support
- ✅ **Credit Cards**: Full support

## 🔄 **Payment Flow States**

```typescript
// Stripe Payment Intent Status Flow
'requires_payment_method' → 'requires_confirmation' → 'requires_capture' ✅

// Status Meanings
'requires_capture' = Authorization successful (treat as success)
'succeeded' = Payment completed
'processing' = Wait for confirmation
'canceled' = User canceled
```

## 🚨 **Common Issues & Fixes**

### **1. "Unsupported prop change: options.clientSecret"**
```typescript
// ❌ Wrong
<Elements clientSecret={clientSecret}>

// ✅ Correct  
<Elements key={clientSecret} clientSecret={clientSecret}>
```

### **2. Apple Pay/Google Pay Not Working**
- **Expected in development** - requires HTTPS + domain verification
- **Will work in production** automatically

### **3. Payment Processing Errors**
- Check payment intent status handling
- Verify `requires_capture` is treated as success

## 🧪 **Testing**

### **Test Cards**
```typescript
'4242424242424242'  // ✅ Success
'4000000000000002'  // ❌ Declined
'4000002500003155'  // 🔒 3D Secure required
```

### **Test Scripts**
```bash
node qa/stripe-payment-test.js      # Payment intent tests
node qa/payment-flow-test.js        # End-to-end flow
node qa/frontend-payment-test.js    # Frontend rendering
```

## 🚀 **Production Deployment Checklist**

- [ ] **HTTPS domain** configured
- [ ] **Stripe domain verification** completed
- [ ] **Live Stripe keys** in environment
- [ ] **Database migrations** applied
- [ ] **Payment flow tested** with live keys

## 📚 **Key Files**

- **`src/app/api/create-payment-intent/route.ts`** - Payment intent creation
- **`src/components/PaymentStep.tsx`** - Payment step wrapper
- **`src/components/PaymentForm.tsx`** - Stripe Payment Element
- **`src/components/TestDriveWidget.tsx`** - Updated flow orchestrator

## 💡 **Quick Commands**

```bash
# Test payment integration
npm run dev
# Navigate to payment step and test with Stripe test cards

# Run automated tests
node qa/stripe-payment-test.js
node qa/payment-flow-test.js

# Check environment variables
cat .env.local | grep STRIPE
```

---

**🎉 This integration is production-ready!** All console warnings about Apple Pay/Google Pay in development are expected and will resolve in production.
