"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, ArrowLeft, Play, Bike, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { formatPrice } from '@/config/rental-pricing'

interface CartItem {
  id: string
  bike_category: string
  rental_duration: number
  rental_price: number
}

interface RentalConfirmationStepProps {
  data: {
    cart_items?: CartItem[]
    total_price?: number
    start_time?: Date
    expected_return_time?: Date
    payment_intent_id?: string
  }
  onComplete: (rentalData: any) => void
  onBack: () => void
}

export default function RentalConfirmationStep({ data, onComplete, onBack }: RentalConfirmationStepProps) {
  const [isStarting, setIsStarting] = useState(false)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const handleStartRental = async () => {
    setIsStarting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const rentalData = {
      ...data,
      cart_items: data.cart_items,
      total_price: data.total_price,
      start_time: data.start_time,
      expected_return_time: data.expected_return_time,
      payment_intent_id: data.payment_intent_id
    }

    onComplete(rentalData)
  }

  const cartItems = data.cart_items || []
  const totalPrice = data.total_price || 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-4"
    >
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-slate-800">Ready to Start Your Rental?</h2>
            <p className="text-sm text-slate-600">Please confirm your rental details</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Bike className="w-4 h-4 text-slate-600"/>
              <span className="font-medium text-slate-800">
                {cartItems.length} Bike{cartItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            {cartItems.map((item, index) => (
              <div key={item.id} className="pl-6 text-sm text-slate-700">
                • {item.bike_category} - {item.rental_duration}hr
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <MapPin className="w-4 h-4 text-slate-600"/>
              <span className="text-slate-700">
                Return by {data.expected_return_time ? formatTime(data.expected_return_time) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-600"/>
              <span className="font-semibold text-green-600">
                {formatPrice(totalPrice)} - Paid
              </span>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-xs text-center">
              Payment confirmed! Make sure you have your ID and helmet. Return by {data.expected_return_time ? formatTime(data.expected_return_time) : 'the agreed time'}.
            </p>
          </div>

          {/* Late Return Warning */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-xs text-center">
              ⚠️ Late returns may incur additional charges. Please return on time.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 h-11"
          disabled={isStarting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleStartRental}
          disabled={isStarting}
          className="flex-1 h-11 font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Rental
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
