'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check, Store, Palette, CreditCard, Settings } from 'lucide-react'
import { createShop, isSlugAvailable, generateSlugFromName } from '@/lib/services/shopService'
import { useRouter } from 'next/navigation'

interface ShopFormData {
  name: string
  business_name: string
  description: string
  email: string
  phone: string
  website_url: string
  slug: string
  primary_color: string
  secondary_color: string
  authorization_amount: number
  test_duration: number
}

const STEPS = [
  { id: 1, name: "Basic Info", icon: Store },
  { id: 2, name: "Branding", icon: Palette },
  { id: 3, name: "Settings", icon: Settings },
  { id: 4, name: "Review", icon: Check }
]

export default function ShopOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    business_name: '',
    description: '',
    email: '',
    phone: '',
    website_url: '',
    slug: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    authorization_amount: 1.00,
    test_duration: 30
  })

  const updateFormData = (updates: Partial<ShopFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const generateSlug = () => {
    const slug = generateSlugFromName(formData.name)
    updateFormData({ slug })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email && formData.slug)
      case 2:
        return !!(formData.primary_color && formData.secondary_color)
      case 3:
        return !!(formData.authorization_amount && formData.test_duration)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      // Check slug availability
      const available = await isSlugAvailable(formData.slug)
      if (!available) {
        alert('Shop URL is already taken. Please choose a different one.')
        setCurrentStep(1)
        setLoading(false)
        return
      }

      // Create the shop
      const shop = await createShop({
        slug: formData.slug,
        name: formData.name,
        business_name: formData.business_name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        website_url: formData.website_url,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        authorization_amount_cents: Math.round(formData.authorization_amount * 100),
        default_test_duration_minutes: formData.test_duration,
        is_active: true,
        onboarded_at: new Date().toISOString()
      })

      if (shop) {
        // Redirect to the new shop's admin panel
        router.push(`/admin/${shop.slug}?onboarded=true`)
      } else {
        throw new Error('Failed to create shop')
      }
    } catch (error) {
      console.error('Shop creation error:', error)
      alert('Failed to create shop. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="e.g., Downtown Electric Bikes"
              />
            </div>
            
            <div>
              <Label htmlFor="business_name">Legal Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => updateFormData({ business_name: e.target.value })}
                placeholder="e.g., Downtown Electric Bikes LLC"
              />
            </div>

            <div>
              <Label htmlFor="slug">Shop URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateFormData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="shop-url"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={generateSlug}>
                  Generate
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                yourshop.com/shop/<strong>{formData.slug || 'your-shop'}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder="contact@yourshop.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Brief description of your bike shop..."
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => updateFormData({ primary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => updateFormData({ primary_color: e.target.value })}
                  placeholder="#3B82F6"
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => updateFormData({ secondary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => updateFormData({ secondary_color: e.target.value })}
                  placeholder="#1E40AF"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Preview</Label>
              <div 
                className="mt-2 p-4 rounded-lg text-white text-center"
                style={{
                  background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)`
                }}
              >
                <h3 className="font-bold text-lg">{formData.name || 'Your Shop Name'}</h3>
                <p className="text-sm opacity-90">Test Ride Sign-Up</p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="authorization_amount">Authorization Amount (USD)</Label>
              <Input
                id="authorization_amount"
                type="number"
                step="0.01"
                min="0.50"
                max="50.00"
                value={formData.authorization_amount}
                onChange={(e) => updateFormData({ authorization_amount: parseFloat(e.target.value) || 1.00 })}
              />
              <p className="text-sm text-gray-500 mt-1">
                Amount to authorize on customer's card (typically $1-$5)
              </p>
            </div>

            <div>
              <Label htmlFor="test_duration">Default Test Duration (minutes)</Label>
              <Input
                id="test_duration"
                type="number"
                min="10"
                max="120"
                value={formData.test_duration}
                onChange={(e) => updateFormData({ test_duration: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) => updateFormData({ website_url: e.target.value })}
                placeholder="https://yourshop.com"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Your Shop Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Shop Name:</span>
                <span>{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">URL:</span>
                <span className="font-mono text-blue-600">
                  yoursite.com/shop/{formData.slug}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Authorization:</span>
                <span>${formData.authorization_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Test Duration:</span>
                <span>{formData.test_duration} minutes</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your shop will be created and activated</li>
                <li>• You'll be redirected to your admin dashboard</li>
                <li>• You can start accepting test rides immediately</li>
                <li>• Customize bike inventory and settings anytime</li>
              </ul>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Bike Shop
          </h1>
          <p className="text-gray-600">
            Set up your test ride system in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        currentStep > step.id 
                          ? 'bg-green-500 text-white' 
                          : currentStep === step.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">{step.name}</p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step {currentStep}: {STEPS[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your bike shop"}
              {currentStep === 2 && "Customize your shop's appearance"}
              {currentStep === 3 && "Configure test ride settings"}
              {currentStep === 4 && "Review and create your shop"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={loading || !validateStep(currentStep)}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating...' : 'Create Shop'}
              {!loading && <Check className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Validation Messages */}
        {currentStep === 1 && !validateStep(1) && formData.name && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please fill in all required fields (marked with *)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}