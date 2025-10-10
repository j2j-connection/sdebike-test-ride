"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, Clock, ArrowRight, ArrowLeft, DollarSign, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getButtonStyles, getThemeClasses } from '@/lib/theme'
import {
  BikeCategory,
  RentalDuration,
  getRentalPrice,
  getBikeCategoryName,
  getDurationName,
  formatPrice,
  calculateExpectedReturn
} from '@/config/rental-pricing'

interface CartItem {
  id: string
  bike_category: BikeCategory
  rental_duration: RentalDuration
  rental_price: number
}

interface RentalSelectionStepWithCartProps {
  data: {
    cart_items?: CartItem[]
    total_price?: number
  }
  shopId?: string
  shop?: { primary_color: string; secondary_color: string; slug: string }
  onUpdate: (data: {
    cart_items: CartItem[]
    total_price: number
    start_time: Date
    expected_return_time: Date
  }) => void
  onNext: () => void
  onBack: () => void
}

const BIKE_OPTIONS: { category: BikeCategory; name: string; description: string }[] = [
  {
    category: 'luxury_ebike',
    name: 'Luxury E-Bike',
    description: 'Premium electric bikes'
  },
  {
    category: 'ebike',
    name: 'E-Bike',
    description: 'Standard electric bikes'
  },
  {
    category: 'escooter',
    name: 'E-Scooter',
    description: 'Electric scooters'
  }
]

const DURATION_OPTIONS: RentalDuration[] = [1, 2]

export default function RentalSelectionStepWithCart({
  data,
  shopId,
  shop,
  onUpdate,
  onNext,
  onBack
}: RentalSelectionStepWithCartProps) {
  const [selectedCategory, setSelectedCategory] = useState<BikeCategory | ''>('')
  const [selectedDuration, setSelectedDuration] = useState<RentalDuration | ''>(''  )
  const [cart, setCart] = useState<CartItem[]>(data.cart_items || [])

  const themeClasses = shop ? getThemeClasses(shop) : null

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + item.rental_price, 0)
  }

  const handleAddToCart = () => {
    if (selectedCategory && selectedDuration) {
      const price = getRentalPrice(selectedCategory, selectedDuration)
      const newItem: CartItem = {
        id: `${Date.now()}-${Math.random()}`,
        bike_category: selectedCategory,
        rental_duration: selectedDuration,
        rental_price: price
      }

      setCart([...cart, newItem])

      // Reset selections
      setSelectedCategory('')
      setSelectedDuration('')
    }
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const handleCheckout = () => {
    if (cart.length > 0) {
      const now = new Date()
      // Use the longest duration for expected return time
      const maxDuration = Math.max(...cart.map(item => item.rental_duration))
      const expectedReturn = calculateExpectedReturn(now, maxDuration as RentalDuration)

      onUpdate({
        cart_items: cart,
        total_price: calculateCartTotal(),
        start_time: now,
        expected_return_time: expectedReturn
      })
      onNext()
    }
  }

  const currentPrice = selectedCategory && selectedDuration
    ? getRentalPrice(selectedCategory, selectedDuration)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-4"
    >
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm w-full">
        <CardContent className="p-4 space-y-4">
          {/* Bike Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Choose Bike Type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {BIKE_OPTIONS.map((option) => (
                <motion.div
                  key={option.category}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      selectedCategory === option.category
                        ? (themeClasses?.selectedCard || 'border-green-500 bg-green-50')
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedCategory(option.category)}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center gap-2">
                        <Bike className="w-5 h-5 text-slate-600" />
                        <div className="text-center">
                          <h3 className="font-semibold text-slate-800 text-xs">
                            {option.name}
                          </h3>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Duration
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((duration) => (
                <motion.div
                  key={duration}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      selectedDuration === duration
                        ? (themeClasses?.selectedCard || 'border-green-500 bg-green-50')
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedDuration(duration)}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-600" />
                        <div className="text-center">
                          <h3 className="font-semibold text-slate-800 text-sm">
                            {getDurationName(duration)}
                          </h3>
                          {selectedCategory && (
                            <p className="text-xs text-green-600 font-semibold mt-1">
                              {formatPrice(getRentalPrice(selectedCategory, duration))}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Add to Cart Button */}
          {currentPrice > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                type="button"
                onClick={handleAddToCart}
                className="w-full h-11 font-semibold text-white"
                style={shop ? getButtonStyles(shop) : { background: 'linear-gradient(to right, #16A34A, #15803D)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart - {formatPrice(currentPrice)}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Cart Summary */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-800">Your Cart ({cart.length})</h3>
                </div>

                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {getBikeCategoryName(item.bike_category)}
                        </p>
                        <p className="text-xs text-slate-600">
                          {getDurationName(item.rental_duration)} - {formatPrice(item.rental_price)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-700">Total</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(calculateCartTotal())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="flex-1 h-10 font-semibold text-white disabled:opacity-50"
          style={shop ? getButtonStyles(shop) : { background: 'linear-gradient(to right, #16A34A, #15803D)' }}
        >
          Checkout ({cart.length})
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )
}
