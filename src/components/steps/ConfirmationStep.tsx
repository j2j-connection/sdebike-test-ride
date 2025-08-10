"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, ArrowLeft, Play, Bike } from "lucide-react"
import { motion } from "framer-motion"

const BIKE_MODELS = {
  rad_power: "Rad Power Bikes",
  aventon: "Aventon",
  other: "Other",
}

interface ConfirmationStepProps {
  data: {
    bike_model?: string
    start_time?: Date
    duration_hours?: number
  }
  onComplete: (driveData: any) => void
  onBack: () => void
}

export default function ConfirmationStep({ data, onComplete, onBack }: ConfirmationStepProps) {
  const [isStarting, setIsStarting] = useState(false)
  const isE2E = process.env.NEXT_PUBLIC_E2E === 'true'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Default to a 10-minute ride when duration is not provided
  const durationMinutes = data.duration_hours ? Math.round(data.duration_hours * 60) : 10
  const endTime = data.start_time 
    ? new Date(data.start_time.getTime() + durationMinutes * 60 * 1000)
    : new Date(new Date().getTime() + durationMinutes * 60 * 1000)

  const handleStartTestDrive = async () => {
    setIsStarting(true)
    if (!isE2E) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    const driveData = {
      ...data,
      bike_model: data.bike_model,
      start_time: data.start_time,
      end_time: endTime
    }
    
    onComplete(driveData)
  }

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
            <h2 className="text-lg font-bold text-slate-800">Ready to Start Your Test Ride?</h2>
            <p className="text-sm text-slate-600">Please confirm your booking details</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-slate-600"/>
              <span className="font-medium text-slate-800">
                {data.bike_model ? BIKE_MODELS[data.bike_model as keyof typeof BIKE_MODELS] : 'No bike selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600"/>
              <span className="text-slate-700">{durationMinutes} {durationMinutes === 1 ? 'minute' : 'minutes'} test ride</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600"/>
              <span className="text-slate-700">Return by {formatTime(endTime)}</span>
            </div>
          </div>
          
          <div className="p-3 bg-lime-50 rounded-lg border border-lime-200">
            <p className="text-lime-800 text-xs text-center">
              Make sure you have your ID and helmet. Enjoy your ride!
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
          data-testid="start-test-ride"
          onClick={handleStartTestDrive}
          disabled={isStarting}
          className="flex-1 h-11 font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Test Ride
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}