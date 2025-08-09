"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, MapPin, MessageSquare, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface SuccessScreenProps {
  testDrive: {
    id: string
    start_time: Date
    end_time: Date
    bike_model: string
  }
  customer: {
    id: string
    name: string
    phone: string
  }
  onStartOver: () => void
}

export default function SuccessScreen({ testDrive, customer, onStartOver }: SuccessScreenProps) {
  const [smsStatus, setSmsStatus] = useState<'sending' | 'sent' | 'failed'>('sending')

  useEffect(() => {
    if (testDrive && customer) {
      sendConfirmationSMS()
    }
  }, [testDrive, customer])

  const sendConfirmationSMS = async () => {
    const returnTime = formatTime(testDrive.end_time)
    const confirmationMessage = `🚴 Your SDEBIKE test ride has started! Please return by ${returnTime}. Location: 1234 Electric Ave, San Diego, CA. Questions? Reply to this message.`
    
    try {
      setSmsStatus('sending')
      
      // TODO: Replace with actual SMS service (Twilio)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate SMS sending
      
      // Mock successful SMS for now
      setSmsStatus('sent')
    } catch (error) {
      console.error("Failed to send confirmation SMS:", error)
      setSmsStatus('failed')
    }
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-lime-500 to-lime-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <CardTitle className="text-3xl font-bold text-slate-800">Test Ride Started!</CardTitle>
          <p className="text-slate-600 mt-2 text-lg">Enjoy your electric bike experience</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-800">Ride Period</span>
              </div>
              <p className="text-slate-700">
                <strong>Started:</strong> {formatTime(testDrive.start_time)}<br />
                <strong>Return by:</strong> {formatTime(testDrive.end_time)}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-800">Return Location</span>
              </div>
              <p className="text-slate-700 text-sm">
                San Diego Electric Bike<br/>
                1234 Electric Ave, San Diego, CA 92101
              </p>
            </div>
          </div>
          
          <Alert className={
            smsStatus === 'sent' ? 'border-green-200 bg-green-50' : 
            smsStatus === 'failed' ? 'border-red-200 bg-red-50' : 
            'border-lime-200 bg-lime-50'
          }>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              <strong>
                {smsStatus === 'sending' && 'Sending confirmation...'}
                {smsStatus === 'sent' && 'Confirmation sent!'}
                {smsStatus === 'failed' && 'Message failed to send'}
              </strong>
              <br />
              {smsStatus === 'sending' && 'We\'re sending you a text confirmation with details.'}
              {smsStatus === 'sent' && 'Check your phone for ride details and return instructions.'}
              {smsStatus === 'failed' && 'Please take note of your return time above.'}
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button onClick={onStartOver} variant="outline" className="w-full h-12 text-lg">
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Another Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}