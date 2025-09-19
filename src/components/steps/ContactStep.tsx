"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { User, Phone, Mail, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { getButtonStyles } from '@/lib/theme'

interface ContactStepProps {
  data: {
    name?: string
    phone?: string
    email?: string
  }
  shop?: { slug: string; primary_color: string; secondary_color: string }
  onUpdate: (data: { name: string; phone: string; email?: string }) => void
  onNext: () => void
  onBack: () => void
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

export default function ContactStep({ data, shop, onUpdate, onNext }: ContactStepProps) {
  const [formData, setFormData] = useState({
    name: data.name || "",
    phone: data.phone || "",
    email: data.email || ""
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) newErrors.name = "Full name is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) newErrors.phone = "Please enter a valid phone number"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onUpdate(formData)
      onNext()
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm w-full">
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <User className="w-3 h-3" />
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
                placeholder="Enter your full name" 
                className={`h-10 ${errors.name ? 'border-red-500' : 'border-slate-200'}`} 
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => handleChange("phone", e.target.value)} 
                placeholder="(555) 123-4567" 
                className={`h-10 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`} 
              />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
              <p className="text-xs text-slate-500">We&apos;ll send you SMS updates about your test ride</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Email Address <span className="text-slate-400 text-xs">(optional)</span>
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => handleChange("email", e.target.value)} 
                placeholder="your.email@example.com" 
                className={`h-10 ${errors.email ? 'border-red-500' : 'border-slate-200'}`} 
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-10 font-semibold text-white"
                style={shop ? getButtonStyles(shop) : { background: 'linear-gradient(to right, #2563EB, #1D4ED8)' }}
              >
                Choose Your Bike
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}