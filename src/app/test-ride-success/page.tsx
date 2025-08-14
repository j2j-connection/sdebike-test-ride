"use client"

import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Bike, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

function TestRideSuccessContent() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Test Ride Confirmed!
              </h1>
              <p className="text-gray-600">
                Your payment has been authorized and your test ride is ready.
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <Bike className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Pick up your bike</p>
                  <p className="text-sm text-gray-600">
                    Head to the bike area and show your confirmation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">30-minute test ride</p>
                  <p className="text-sm text-gray-600">
                    Return the bike within 30 minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Stay in the area</p>
                  <p className="text-sm text-gray-600">
                    Please don&apos;t take the bike off-premises
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> The $1 hold on your payment method will be 
                automatically released when you return the bike. No charges will be made 
                unless there are damages.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => window.close()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Got it!
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Book Another Test Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}

export default function TestRideSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestRideSuccessContent />
    </Suspense>
  )
}
