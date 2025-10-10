"use client"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import PaymentForm from "../PaymentForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentIntent } from "@stripe/stripe-js"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import { formatPrice } from '@/config/rental-pricing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  bike_category: string
  rental_duration: number
  rental_price: number
}

interface RentalPaymentStepProps {
  data: {
    name: string
    email: string
    phone: string
    cart_items?: CartItem[]
    total_price?: number
    start_time: Date
  }
  onNext: () => void
  onBack: () => void
  onUpdate: (data: { payment_intent_id: string; payment_status: string }) => void
}

export default function RentalPaymentStep({ data, onUpdate, onNext, onBack }: RentalPaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const totalPrice = data.total_price || 0
      const cartItems = data.cart_items || []

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100), // Convert to cents
          customerEmail: data.email || 'test@example.com',
          testRideId: `rental-${Date.now()}`,
          isRental: true,
          rentalDetails: {
            cartItems: cartItems,
            totalPrice: totalPrice,
            itemCount: cartItems.length
          }
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

  const handlePaymentSuccess = (paymentIntent: PaymentIntent) => {
    onUpdate({
      payment_intent_id: paymentIntent.id,
      payment_status: 'completed'
    })
    onNext()
  }

  const handlePaymentError = (message: string) => {
    setError(message)
    setClientSecret("")
  }

  const handleTestPayment = () => {
    onUpdate({
      payment_intent_id: 'test-rental-123',
      payment_status: 'completed'
    })
    onNext()
  }

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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

  const cartItems = data.cart_items || []
  const totalPrice = data.total_price || 0

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Rental Payment
          </CardTitle>
          <CardDescription>
            Complete payment of {formatPrice(totalPrice)} for {cartItems.length} bike rental{cartItems.length !== 1 ? 's' : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Price Summary */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.bike_category} ({item.rental_duration}hr):
                  </span>
                  <span className="font-semibold">{formatPrice(item.rental_price)}</span>
                </div>
              ))}
              <div className="border-t border-green-300 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-slate-700">Total:</span>
                <span className="text-xl font-bold text-green-600">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          {clientSecret ? (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#16a34a',
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
