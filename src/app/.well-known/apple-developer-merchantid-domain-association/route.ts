import { NextResponse } from 'next/server'

export async function GET() {
  // This is a placeholder - Stripe will provide the actual content
  // You'll need to replace this with the actual verification file content from Stripe
  const verificationContent = `# Apple Pay Domain Verification
# This file should contain the verification content provided by Stripe
# Replace this placeholder with the actual content from your Stripe dashboard

# Domain: sdebike-test-ride-bfsk180ph-j2-j.vercel.app
# Stripe Domain ID: pmd_1RwDEdA3dzhvH5fqvIczYN6s

# Instructions:
# 1. Go to Stripe Dashboard > Payment Methods > Apple Pay
# 2. Find your domain verification
# 3. Download the verification file
# 4. Replace this content with the actual file content
# 5. Deploy to trigger verification

# The file should be accessible at:
# https://sdebike-test-ride-bfsk180ph-j2-j.vercel.app/.well-known/apple-developer-merchantid-domain-association`

  return new NextResponse(verificationContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
