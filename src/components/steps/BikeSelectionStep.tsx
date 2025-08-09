"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, Zap, ArrowRight, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

const BIKE_BRANDS = {
  rad_power: {
    name: "Rad Power Bikes",
    description: "Any Rad model",
    icon: Zap,
    type: "Brand"
  },
  aventon: {
    name: "Aventon",
    description: "Any Aventon model",
    icon: Bike,
    type: "Brand"
  },
  other: {
    name: "Other",
    description: "Another brand/model",
    icon: Bike,
    type: "Brand"
  }
}

interface BikeSelectionStepProps {
  data: {
    bike_model?: string
  }
  onUpdate: (data: { bike_model: string; start_time: Date; duration_hours: number }) => void
  onNext: () => void
  onBack: () => void
}

export default function BikeSelectionStep({ data, onUpdate, onNext, onBack }: BikeSelectionStepProps) {
  const [selectedBike, setSelectedBike] = useState(data.bike_model || "")

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
                {Object.entries(BIKE_BRANDS).map(([key, item]) => {
                  const IconComponent = item.icon
                  return (
                    <motion.div key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Card 
                        className={`cursor-pointer transition-all duration-200 border-2 w-full ${
                          selectedBike === key 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedBike(key)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                              <p className="text-xs text-slate-600 break-words">{item.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                              {item.type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
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
                className="flex-1 h-10 font-semibold bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 disabled:opacity-50"
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