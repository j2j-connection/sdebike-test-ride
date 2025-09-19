"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, Zap, ArrowRight, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { getShopBikeInventory, BikeInventoryItem } from '@/lib/services/shopService'
import { getButtonStyles, getThemeClasses } from '@/lib/theme'

// Default fallback bikes if database is not available
const DEFAULT_BIKES = [
  {
    id: 'default-1',
    model: 'e-Commuter',
    brand: 'Solé Bicycle Co.',
    description: 'Electric commuter bike - Available in multiple designs. Perfect for daily commuting.',
    is_available: true
  },
  {
    id: 'default-2',
    model: 'The Single Speed / Fixed Gear',
    brand: 'Solé Bicycle Co.',
    description: 'Classic single speed bike - Available in multiple colorways. Perfect for city riding.',
    is_available: true
  },
  {
    id: 'default-3',
    model: 'The Coastal Cruiser',
    brand: 'Solé Bicycle Co.',
    description: 'Classic beach cruiser - Perfect for leisurely coastal rides.',
    is_available: true
  }
]

interface BikeSelectionStepProps {
  data: {
    bike_model?: string
  }
  shopId?: string
  shop?: { primary_color: string; secondary_color: string; slug: string }
  onUpdate: (data: { bike_model: string; start_time: Date; duration_hours: number }) => void
  onNext: () => void
  onBack: () => void
}

export default function BikeSelectionStep({ data, shopId, shop, onUpdate, onNext, onBack }: BikeSelectionStepProps) {
  const [selectedBike, setSelectedBike] = useState(data.bike_model || "")
  const [bikes, setBikes] = useState<BikeInventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Get theme classes if shop is provided
  const themeClasses = shop ? getThemeClasses(shop) : null

  useEffect(() => {
    async function loadBikes() {
      if (shopId) {
        try {
          const inventory = await getShopBikeInventory(shopId)
          if (inventory && inventory.length > 0) {
            setBikes(inventory)
          } else {
            console.log('No bike inventory found, using default bikes')
            setBikes(DEFAULT_BIKES as BikeInventoryItem[])
          }
        } catch (error) {
          console.error('Error loading bike inventory:', error)
          setBikes(DEFAULT_BIKES as BikeInventoryItem[])
        }
      } else {
        setBikes(DEFAULT_BIKES as BikeInventoryItem[])
      }
      setLoading(false)
    }

    loadBikes()
  }, [shopId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBike) {
      const now = new Date()
      const endTime = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes from now
      
      onUpdate({ 
        bike_model: selectedBike,
        start_time: now,
        duration_hours: 10/60 // 10 minutes as fraction of hour
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
            <div className="space-y-2">
               <Label className="text-sm font-medium text-slate-700">
                 Choose Brand
              </Label>
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-slate-500">Loading bikes...</div>
                  </div>
                ) : (
                  bikes.map((bike) => {
                    const bikeKey = `${bike.brand}-${bike.model}`.toLowerCase().replace(/\s+/g, '-')
                    return (
                      <motion.div key={bike.id || bikeKey} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                          className={`cursor-pointer transition-all duration-200 border-2 w-full ${
                            selectedBike === bikeKey
                              ? (themeClasses?.selectedCard || 'border-blue-500 bg-blue-50')
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedBike(bikeKey)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bike className="w-5 h-5 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 text-sm">{bike.model}</h3>
                                <p className="text-xs text-slate-600 break-words">{bike.description || `${bike.brand} ${bike.model}`}</p>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                                {bike.brand}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>


            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={!selectedBike}
                className="flex-1 h-10 font-semibold text-white disabled:opacity-50"
                style={shop ? getButtonStyles(shop) : { background: 'linear-gradient(to right, #2563EB, #1D4ED8)' }}
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