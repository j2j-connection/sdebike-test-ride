"use client"

import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import ContactStep from "@/components/steps/ContactStep"
import BikeSelectionStep from "@/components/steps/BikeSelectionStep"
import VerificationStep from "@/components/steps/VerificationStep"
import ConfirmationStep from "@/components/steps/ConfirmationStep"
import SuccessScreen from "@/components/steps/SuccessScreen"

interface FormData {
  name?: string
  phone?: string
  email?: string
  bike_model?: string
  start_time?: Date
  duration_hours?: number
  id_photo_url?: string
  waiver_signed?: boolean
  signature_data?: string
  waiver_url?: string
  submission_ip?: string
  submitted_at?: string
}

interface CompletedData {
  testDrive: any
  customer: any
}

const STEPS = [
  { id: 1, name: "Contact Info", component: ContactStep },
  { id: 2, name: "Bike Selection", component: BikeSelectionStep },
  { id: 3, name: "Verification", component: VerificationStep },
  { id: 4, name: "Confirmation", component: ConfirmationStep }
]

export default function TestDriveWidget() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({})
  const [completedData, setCompletedData] = useState<CompletedData | null>(null)

  const handleStepUpdate = (stepData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async (driveData: any) => {
    try {
      console.log("Current formData:", formData)
      console.log("Drive data passed:", driveData)
      
      const { testDriveService } = await import("@/lib/services/testDriveService")
      
      const createData = {
        customer: {
          name: formData.name!,
          phone: formData.phone!,
          email: formData.email,
          id_photo_url: formData.id_photo_url!,
          signature_data: formData.signature_data!,
          waiver_url: formData.waiver_url,
          waiver_signed: formData.waiver_signed!,
          submission_ip: formData.submission_ip,
          submitted_at: formData.submitted_at || new Date().toISOString()
        },
        testDrive: {
          bike_model: formData.bike_model!,
          start_time: formData.start_time!,
          end_time: new Date(formData.start_time!.getTime() + (formData.duration_hours! * 60 * 60 * 1000))
        }
      }
      
      console.log("About to create with data:", createData)

      const result = await testDriveService.createTestDrive(createData)
      
      setCompletedData({
        customer: result.customer,
        testDrive: result.testDrive
      })
      setCurrentStep(5) // Success screen
    } catch (error) {
      console.error("Failed to complete test drive:", error)
      alert("There was an error creating your test ride. Please try again.")
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
                  ? 'bg-blue-500 text-white' 
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
                currentStep > step.id ? 'bg-blue-500' : 'bg-slate-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-2">
        <div className="max-w-md mx-auto">
          <SuccessScreen 
            testDrive={completedData?.testDrive}
            customer={completedData?.customer}
            onStartOver={handleStartOver}
          />
        </div>
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-2 overflow-x-hidden">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="relative text-center mb-4 pt-2">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-3 rounded-lg shadow-md mb-2">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img
                src="/logo.png"
                alt="San Diego Electric Bike Logo"
                className="w-10 h-10 object-contain bg-white rounded-lg p-1"
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = "/file.svg"
                }}
              />
              <h1 className="text-lg font-bold">San Diego Electric Bike</h1>
            </div>
            <p className="text-sm text-blue-100">Test Ride Sign-Up</p>
          </div>
        </div>

        {renderProgressBar()}

        <div className="pb-4">
          <AnimatePresence mode="wait">
            <CurrentStepComponent
              key={currentStep}
              data={formData}
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