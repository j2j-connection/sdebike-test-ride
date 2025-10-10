"use client"

import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import ContactStep from "@/components/steps/ContactStep"
import RentalSelectionStepWithCart from "@/components/steps/RentalSelectionStepWithCart"
import VerificationStep from "@/components/steps/VerificationStep"
import RentalPaymentStep from "@/components/steps/RentalPaymentStep"
import RentalConfirmationStep from "@/components/steps/RentalConfirmationStep"
import SuccessScreen from "@/components/steps/SuccessScreen"
import { Shop } from '@/lib/services/shopService'
import { getThemeClasses } from '@/lib/theme'
import { BikeCategory, RentalDuration } from '@/config/rental-pricing'

interface CartItem {
  id: string
  bike_category: BikeCategory
  rental_duration: RentalDuration
  rental_price: number
}

interface RentalFormData {
  name?: string
  phone?: string
  email?: string
  cart_items?: CartItem[]
  total_price?: number
  start_time?: Date
  expected_return_time?: Date
  id_photo_url?: string
  waiver_signed?: boolean
  signature_data?: string
  waiver_url?: string
  submission_ip?: string
  submitted_at?: string
  payment_intent_id?: string
}

interface CompletedData {
  rental: any
  customer: any
}

const STEPS = [
  { id: 1, name: "Contact Info", component: ContactStep },
  { id: 2, name: "Cart", component: RentalSelectionStepWithCart },
  { id: 3, name: "Verification", component: VerificationStep },
  { id: 4, name: "Payment", component: RentalPaymentStep },
  { id: 5, name: "Confirmation", component: RentalConfirmationStep }
]

interface RentalWidgetProps {
  shop: Shop
}

export default function RentalWidget({ shop }: RentalWidgetProps) {
  console.log('🏪 RentalWidget received shop:', {
    name: shop.name,
    logo_url: shop.logo_url,
    primary_color: shop.primary_color
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RentalFormData>({})
  const [completedData, setCompletedData] = useState<CompletedData | null>(null)

  // Get theme classes for consistent styling
  const themeClasses = getThemeClasses(shop)

  const handleStepUpdate = (stepData: Partial<RentalFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async (rentalData: any) => {
    try {
      // Use the rentalData passed from RentalConfirmationStep if available
      const finalData = {
        ...formData,
        ...rentalData
      }

      const { testDriveService } = await import("@/lib/services/testDriveService")

      const createData = {
        customer: {
          name: finalData.name!,
          phone: finalData.phone!,
          email: finalData.email,
          id_photo_url: finalData.id_photo_url!,
          signature_data: finalData.signature_data!,
          waiver_url: finalData.waiver_url,
          waiver_signed: finalData.waiver_signed!,
          submission_ip: finalData.submission_ip,
          submitted_at: finalData.submitted_at || new Date().toISOString()
        },
        cart_items: finalData.cart_items!,
        total_price: finalData.total_price!,
        start_time: finalData.start_time!,
        expected_return_time: finalData.expected_return_time!,
        payment_intent_id: finalData.payment_intent_id
      }

      const result = await testDriveService.createCartRental(createData)

      setCompletedData({
        customer: result.customer,
        rental: result.rentals[0] // Use first rental for success screen
      })
      setCurrentStep(5) // Success screen
    } catch (error) {
      console.error('Error creating rental:', error)
      alert("There was an error creating your rental. Please try again.")
    }
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setFormData({})
    setCompletedData(null)
  }

  const renderProgressBar = () => (
    <div className="mb-4 px-2">
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : currentStep === step.id
                  ? 'bg-yellow-400 text-slate-800'
                  : 'bg-slate-300 text-slate-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <p className="text-xs text-slate-600 mt-1 text-center">{step.name}</p>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-3.5 mb-6 transition-colors ${
                currentStep > step.id ? 'bg-green-500' : 'bg-slate-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  // Render success screen only after completion
  if (completedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 p-2">
        <div className="max-w-md mx-auto">
          <SuccessScreen
            testDrive={completedData.rental}
            customer={completedData.customer}
            onStartOver={handleStartOver}
            isRental={true}
          />
        </div>
      </div>
    )
  }

  // Render current step component
  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 p-2 overflow-x-hidden">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="relative text-center mb-4 pt-2">
          <div
            className="text-white px-4 py-3 rounded-lg shadow-md mb-2"
            style={themeClasses.headerGradient}
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <img
                src={
                  shop.slug === 'sole-bicycles'
                    ? '/sole-bicycles-logo.svg'
                    : shop.logo_url || "/logo.png"
                }
                alt={`${shop.name} Logo`}
                className="w-10 h-10 object-contain bg-white rounded-lg p-1"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = "/file.svg"
                }}
              />
              <h1 className="text-lg font-bold">{shop.name}</h1>
            </div>
            <p className="text-sm opacity-90">Bike Rental</p>
          </div>
        </div>

        {renderProgressBar()}

        <div className="pb-4">
          <AnimatePresence mode="wait">
            <CurrentStepComponent
              key={currentStep}
              data={formData}
              shopId={shop.id}
              shop={shop}
              onUpdate={handleStepUpdate}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
