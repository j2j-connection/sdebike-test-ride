"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, Clock, ArrowRight, ArrowLeft, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
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

interface RentalSelectionStepProps {
  data: {
    bike_model?: string
    bike_category?: BikeCategory
    rental_duration?: RentalDuration
    rental_price?: number
  }
  shopId?: string
  shop?: { primary_color: string; secondary_color: string; slug: string }
  onUpdate: (data: {
    bike_model: string
    bike_category: BikeCategory
    rental_duration: RentalDuration
    rental_price: number
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
    description: 'Premium electric bikes with top-tier features and comfort'
  },
  {
    category: 'ebike',
    name: 'E-Bike',
    description: 'Standard electric bikes perfect for city riding'
  },
  {
    category: 'escooter',
    name: 'E-Scooter',
    description: 'Compact and agile electric scooters for quick trips'
  }
]

const DURATION_OPTIONS: RentalDuration[] = [1, 2]

export default function RentalSelectionStep({
  data,
  shopId,
  shop,
  onUpdate,
  onNext,
  onBack
}: RentalSelectionStepProps) {
  const [selectedCategory, setSelectedCategory] = useState<BikeCategory | ''>(data.bike_category || '')
  const [selectedDuration, setSelectedDuration] = useState<RentalDuration | ''>(data.rental_duration || '')

  const themeClasses = shop ? getThemeClasses(shop) : null

  const calculatePrice = () => {
    if (selectedCategory && selectedDuration) {
      return getRentalPrice(selectedCategory, selectedDuration)
    }
    return 0
  }

  const currentPrice = calculatePrice()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCategory && selectedDuration) {
      const now = new Date()
      const expectedReturn = calculateExpectedReturn(now, selectedDuration)
      const price = getRentalPrice(selectedCategory, selectedDuration)

      onUpdate({
        bike_model: getBikeCategoryName(selectedCategory),
        bike_category: selectedCategory,
        rental_duration: selectedDuration,
        rental_price: price,
        start_time: now,
        expected_return_time: expectedReturn
      })
      onNext()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm w-full">
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bike Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Choose Bike Type
              </Label>
              <div className="space-y-2">
                {BIKE_OPTIONS.map((option) => (
                  <motion.div
                    key={option.category}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 border-2 w-full ${
                        selectedCategory === option.category
                          ? (themeClasses?.selectedCard || 'border-green-500 bg-green-50')
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedCategory(option.category)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bike className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 text-sm">{option.name}</h3>
                            <p className="text-xs text-slate-600 break-words">{option.description}</p>
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
                Rental Duration
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
                          <Clock className="w-6 h-6 text-slate-600" />
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

            {/* Price Display */}
            {currentPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Total Rental Cost</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Full payment charged upfront • Includes all fees
                </p>
              </motion.div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!selectedCategory || !selectedDuration}
                className="flex-1 h-10 font-semibold text-white disabled:opacity-50"
                style={shop ? getButtonStyles(shop) : { background: 'linear-gradient(to right, #16A34A, #15803D)' }}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
