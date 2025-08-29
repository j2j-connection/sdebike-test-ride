# TESTR - Troubleshooting Guide

## Critical Stripe Integration Issues

### Problem: "client_secret provided does not match" Error

**Symptoms:**
- Browser console shows: `error: {type: "invalid_request_error", message: "The client_secret provided does not match any associated PaymentIntent"}`
- Payment form fails to load properly
- Stripe Elements show connection errors
- Secret keys appearing in browser console (SECURITY ISSUE)

**Root Cause:**
**Mismatched Stripe API keys** - The publishable key (frontend) and secret key (backend) are from different Stripe accounts or are outdated.

**CRITICAL SECURITY ISSUE:**
- Server-side logs containing secret keys were being exposed to browser console
- Test endpoints were logging sensitive key information

**Resolution Steps:**

1. **IMMEDIATE SECURITY FIX:**
   - Deleted `/api/test-stripe` and `/api/test-network` endpoints that were leaking secrets
   - Removed all console.log statements containing key information
   - **ACTION REQUIRED:** Rotate Stripe secret keys in dashboard immediately

2. **Fix Key Mismatch:**
   ```bash
   # Go to Stripe Dashboard > Developers > API Keys
   # Copy BOTH keys from the SAME account:
   # - Publishable key (pk_live_...)  
   # - Secret key (sk_live_...)
   
   # Update Vercel environment variables:
   vercel env rm STRIPE_SECRET_KEY production
   vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   
   echo "sk_live_YOUR_NEW_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production
   echo "pk_live_YOUR_MATCHING_PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   ```

3. **Verify Key Matching:**
   - Both keys must have the same account ID (the part after `pk_live_51` or `sk_live_51`)
   - Example: `pk_live_51Rvs8W...` and `sk_live_51Rvs8W...` (same `51Rvs8W` part)

4. **Clear Browser Cache:**
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Try incognito/private browsing mode
   - Clear site data for testr.j2j.info

**Prevention:**
- Never log secret keys or parts of secret keys in any environment
- Always verify key pairs are from the same Stripe account
- Use webhook secrets for secure event handling
- Regular key rotation for security

---

*Last Updated: August 29, 2025*
*Status: CRITICAL - Requires immediate key rotation and verification*