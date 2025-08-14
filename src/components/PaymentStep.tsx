"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import PaymentForm from "./PaymentForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"

// Load Stripe outside of component to avoid recreating on every render
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock_123"
const stripePromise = loadStripe(publishableKey)

interface PaymentStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export default function PaymentStep({ data, onUpdate, onNext, onBack }: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create payment intent when component mounts
  useEffect(() => {
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100, // $1.00 in cents
          customerEmail: data.email || 'test@example.com',
          testRideId: `test-${Date.now()}`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const result = await response.json()
      setClientSecret(result.clientSecret)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment'
      setError(errorMessage)
      console.error('Payment intent creation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent: any) => {
    onUpdate({ 
      payment_intent_id: paymentIntent.id, 
      payment_status: 'completed' 
    })
    onNext()
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    onUpdate({ 
      payment_intent_id: null, 
      payment_status: 'failed' 
    })
  }

  const handleTestPayment = () => {
    // Fallback test payment for development
    onUpdate({ 
      payment_intent_id: 'test-123', 
      payment_status: 'completed' 
    })
    onNext()
  }

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold">Setting up payment...</h2>
          <p className="text-gray-600">Please wait while we prepare your payment form.</p>
        </div>
      </div>
    )
  }

  if (error && !clientSecret) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-red-700">Payment Setup Failed</h2>
          <p className="text-gray-600">{error}</p>
          <div className="space-y-3">
            <Button onClick={createPaymentIntent} className="w-full">
              Try Again
            </Button>
            <Button onClick={handleTestPayment} variant="outline" className="w-full">
              Use Test Payment
            </Button>
            <Button onClick={onBack} variant="ghost" className="w-full">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Authorization
          </CardTitle>
          <CardDescription>
            Complete the $1 pre-authorization hold to proceed with your test ride.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements 
              key={clientSecret} // Prevent re-rendering issues
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#10b981',
                  },
                },
                loader: 'auto'
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                userEmail={data.email}
                userName={data.name}
              />
            </Elements>
          ) : (
            <div className="text-center p-6">
              <p className="text-gray-600 mb-4">Payment form not ready.</p>
              <Button onClick={handleTestPayment} className="w-full">
                Use Test Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        
        {!clientSecret && (
          <Button onClick={handleTestPayment} variant="outline">
            Skip Payment (Test Mode)
          </Button>
        )}
      </div>
    </div>
  )
}
