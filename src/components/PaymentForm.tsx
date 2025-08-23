"use client"

import React, { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield } from 'lucide-react'
import { PaymentIntent } from '@stripe/stripe-js'

interface PaymentFormProps {
  clientSecret: string
  onSuccess: (paymentIntent: PaymentIntent) => void
  onError: (message: string) => void
  userEmail?: string
  userName?: string
}

export default function PaymentForm({ clientSecret, onSuccess, onError, userEmail, userName }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')

  // Prevent multiple submissions
  useEffect(() => {
    if (paymentStatus === 'completed' || paymentStatus === 'failed') {
      setIsProcessing(false)
    }
  }, [paymentStatus])

  // Simple check for payment method availability
  useEffect(() => {
    // Payment methods initialized
  }, [stripe, elements])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      const errorMsg = "Payment system not ready. Please try again."
      setError(errorMsg)
      return
    }

    // Prevent multiple submissions
    if (isProcessing || paymentStatus === 'completed') {
      return
    }

    setIsLoading(true)
    setIsProcessing(true)
    setError(null)
    setPaymentStatus('processing')

    try {
      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/test-ride-success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        
        // Handle specific error types
        if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
          setError(confirmError.message || 'Payment failed. Please check your card details.')
        } else if (confirmError.type === 'invalid_request_error') {
          setError('Payment request invalid. Please try again.')
        } else {
          setError(confirmError.message || 'Payment failed. Please try again.')
        }
        
        setPaymentStatus('failed')
        onError(confirmError.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('completed')
        onSuccess(paymentIntent)
      } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
        setPaymentStatus('completed')
        onSuccess(paymentIntent)
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        setPaymentStatus('processing')
        setError('Payment is being processed. Please wait...')
      } else if (paymentIntent && paymentIntent.status === 'canceled') {
        setPaymentStatus('failed')
        setError('Payment was canceled. Please try again.')
        onError('Payment canceled')
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setPaymentStatus('processing')
        // Handle 3D Secure or other authentication
        setError('Payment requires additional verification. Please complete the authentication.')
      } else {
        setPaymentStatus('failed')
        setError(`Unexpected payment status: ${paymentIntent?.status}. Please check with support.`)
        onError(`Unexpected payment status: ${paymentIntent?.status}`)
      }
    } catch (error) {
      setPaymentStatus('failed')
      setError('Payment processing failed. Please try again.')
      onError('Payment processing failed')
    } finally {
      setIsLoading(false)
      // Keep isProcessing true if we're waiting for user action
      if (paymentStatus !== 'processing') {
        setIsProcessing(false)
      }
    }
  }

  // Reset form when client secret changes
  useEffect(() => {
    setError(null)
    setPaymentStatus('idle')
    setIsProcessing(false)
    setIsLoading(false)
  }, [clientSecret])

  // Disable form if already processing
  const isFormDisabled = isLoading || isProcessing || paymentStatus === 'completed'

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-xl">Payment Authorization</CardTitle>
        <CardDescription>
          We&apos;ll place a $1 authorization hold on your card to verify your identity.
          <br />
          <span className="text-sm text-gray-500">No charges will be made.</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
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
                    name: userName || "Test User",
                    email: userEmail || "test@example.com"
                  }
                }
              }}
            />
          </div>

          {/* Digital Wallet Support Indicators */}
          <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">🍎</span>
              </div>
              <span>Apple Pay</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span>Google Pay</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">💳</span>
              </div>
              <span>Credit Card</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'completed' && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ Payment authorized successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isFormDisabled}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === 'completed' ? (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Authorized ✓
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Authorize $1 Hold
              </>
            )}
          </Button>

          {paymentStatus === 'processing' && (
            <p className="text-sm text-gray-600 text-center">
              Processing payment authorization...
            </p>
          )}

        </form>
      </CardContent>
    </Card>
  )
}
