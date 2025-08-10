"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CreditCard, ArrowRight, ArrowLeft, AlertCircle, Check } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
// We generate a PNG waiver to fit the storage bucket's image-only allowed types

interface VerificationStepProps {
  data: {
    id_photo_url?: string
    waiver_signed?: boolean
    signature_data?: string
    waiver_url?: string
  }
  onUpdate: (data: { id_photo_url: string; waiver_signed: boolean; signature_data: string; waiver_url?: string }) => void
  onNext: () => void
  onBack: () => void
}

export default function VerificationStep({ data, onUpdate, onNext, onBack }: VerificationStepProps) {
  const [formData, setFormData] = useState({
    id_photo_url: data.id_photo_url || "",
    waiver_signed: data.waiver_signed || false,
    signature_data: data.signature_data || "",
    waiver_url: data.waiver_url || "",
  })
  const [waiverUrl, setWaiverUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signatureContainerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(data.id_photo_url ? "success" : "")
  const [isWaiverOpen, setIsWaiverOpen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = signatureContainerRef.current
    
    const setCanvasSize = () => {
      if (canvas && container) {
        const { width } = container.getBoundingClientRect()
        canvas.width = width - 4 // Account for border
        canvas.height = 100
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          
          if (formData.signature_data) {
            const img = new Image()
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            img.src = formData.signature_data
          }
        }
      }
    }
    
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
    return () => window.removeEventListener('resize', setCanvasSize)
  }, [formData.signature_data])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadStatus("uploading")
      try {
        const file = e.target.files[0]
        
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `id-photos/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customer-files')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('customer-files')
          .getPublicUrl(filePath)

        setFormData(prev => ({ ...prev, id_photo_url: publicUrl }))
        setUploadStatus("success")
      } catch (error) {
        console.error("Upload failed:", error)
        setUploadStatus("failed")
      }
    }
  }

  const uploadWaiverFile = async (signatureDataUrl?: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1600
    const ctx = canvas.getContext('2d')!
    // background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    ctx.fillText('San Diego Electric Bike - Test Ride Waiver & Release', 40, 80)
    ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    const paragraphs = [
      'I acknowledge that riding an electric bicycle involves inherent risks, including risk of serious injury.',
      'I am competent to operate a bicycle, will obey all traffic laws, and will use appropriate safety equipment.',
      'I accept full responsibility for my actions during this test ride and agree to return the bicycle by the agreed time in the same condition received.',
      'I release and hold harmless San Diego Electric Bike, its owners and employees from any and all claims arising from my participation.',
      'By signing below, I acknowledge I have read and agree to the terms above.'
    ]
    let y = 140
    paragraphs.forEach(p => {
      const words = p.split(' ')
      let line = ''
      const maxWidth = 1120
      words.forEach(word => {
        const test = line + word + ' '
        if (ctx.measureText(test).width > maxWidth) {
          ctx.fillText(line, 40, y)
          line = word + ' '
          y += 32
        } else {
          line = test
        }
      })
      if (line) ctx.fillText(line, 40, y)
      y += 40
    })
    // signature title
    y += 40
    ctx.font = 'bold 24px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    ctx.fillText('Signature', 40, y)
    y += 12
    // signature image (optional)
    if (signatureDataUrl) {
      const sigImg = new Image()
      await new Promise<void>((resolve, reject) => {
        sigImg.onload = () => { resolve() }
        sigImg.onerror = () => resolve() // skip if invalid
        sigImg.src = signatureDataUrl
      })
      if (sigImg.width && sigImg.height) {
        ctx.drawImage(sigImg, 40, y, 600, 160)
      } else {
        // placeholder line
        ctx.strokeStyle = '#cbd5e1'
        ctx.strokeRect(40, y, 600, 160)
      }
    } else {
      ctx.strokeStyle = '#cbd5e1'
      ctx.strokeRect(40, y, 600, 160)
    }
    // footer line
    y += 180
    ctx.strokeStyle = '#94a3b8'
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(640, y)
    ctx.stroke()

    const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b as Blob), 'image/png'))
    const fileName = `waivers/${Date.now()}.png`
    const { error: uploadError } = await supabase.storage.from('customer-files').upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true,
    })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('customer-files').getPublicUrl(fileName)
    setWaiverUrl(publicUrl)
    setFormData(prev => ({ ...prev, waiver_url: publicUrl }))
    return publicUrl
  }

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const touch = 'touches' in e ? e.touches[0] : e
    return { 
      x: (touch.clientX - rect.left) * (canvas.width / rect.width), 
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const { x, y } = getEventPosition(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getEventPosition(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = async () => {
    if (isDrawing) {
      setIsDrawing(false)
      const signatureData = canvasRef.current!.toDataURL()
      // Persist a waiver file that embeds the signature
      try {
        const waiverUrl = await uploadWaiverFile(signatureData)
        console.log('Waiver saved at:', waiverUrl)
      } catch (err) {
        console.error('Failed to store waiver file', err)
      }
      setFormData(prev => ({ ...prev, signature_data: signatureData }))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setFormData(prev => ({ ...prev, signature_data: "" }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.id_photo_url && formData.waiver_signed && formData.signature_data && formData.waiver_url) {
      onUpdate(formData)
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
      <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm w-full">        
        <CardContent className="p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <CreditCard className="w-3 h-3" />
                Photo ID Upload <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center" aria-live="polite">
                {uploadStatus === "success" ? (
                  <div className="space-y-1" data-testid="id-upload-success">
                    <div className="w-6 h-6 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-green-600 font-medium text-xs">ID uploaded successfully</p>
                  </div>
                ) : uploadStatus === "uploading" ? (
                  <div className="space-y-1" data-testid="id-uploading">
                    <div className="w-6 h-6 mx-auto bg-lime-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-lime-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-lime-600 text-xs">Uploading...</p>
                  </div>
                ) : uploadStatus === "failed" ? (
                  <div className="space-y-1" data-testid="id-upload-failed">
                    <div className="w-6 h-6 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    </div>
                    <p className="text-red-600 text-xs">Upload failed. Please try again.</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="id-upload-retry" />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('id-upload-retry')?.click()}>
                      Retry Upload
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1" data-testid="id-upload-empty">
                    <Upload className="w-5 h-5 mx-auto text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-700 text-xs">Upload a photo of your ID</p>
                      <p className="text-xs text-slate-500">Driver's license, passport, or state ID</p>
                    </div>
                    <input data-testid="id-file-input" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="id-upload" />
                    <Button data-testid="id-choose-file" type="button" variant="outline" size="sm" onClick={() => document.getElementById('id-upload')?.click()}>
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Alert className="p-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">You must read and agree to the waiver and provide a signature to continue.</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWaiverOpen(true)} data-testid="open-waiver">
                Read Waiver
              </Button>
              {formData.waiver_signed && (
                <p className="text-xs text-green-700">Waiver read and agreed.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Digital Signature <span className="text-red-500">*</span></Label>
              <div ref={signatureContainerRef} className="border-2 border-slate-300 rounded-lg bg-white">
                <canvas 
                  ref={canvasRef} 
                  className="w-full cursor-crosshair touch-none rounded-t-lg block" 
                  style={{ height: '100px', background: 'white' }}
                  onMouseDown={startDrawing} 
                  onMouseMove={draw} 
                  onMouseUp={stopDrawing} 
                  onMouseLeave={stopDrawing} 
                  onTouchStart={startDrawing} 
                  onTouchMove={draw} 
                  onTouchEnd={stopDrawing} 
                />
                <div className="flex justify-between items-center p-2 border-t bg-slate-50 rounded-b-lg">
                  <p className="text-xs text-slate-500">Sign above with your finger or mouse</p>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearSignature}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                data-testid="verification-continue"
                type="submit" 
                disabled={!formData.id_photo_url || !formData.waiver_signed || !formData.signature_data} 
                className="flex-1 h-10 font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {isWaiverOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setIsWaiverOpen(false)} aria-hidden="true" />
                <div role="dialog" aria-modal="true" aria-labelledby="waiver-title" className="relative bg-white rounded-xl shadow-xl max-w-2xl w-[90vw] max-h-[85vh] overflow-hidden">
                  <div className="p-4 border-b">
                    <h2 id="waiver-title" className="text-lg font-semibold text-slate-800">Test Ride Waiver & Release</h2>
                  </div>
                  <div className="p-4 overflow-auto space-y-3 text-sm text-slate-700" style={{ maxHeight: '60vh' }}>
                    <p>I acknowledge that riding an electric bicycle involves inherent risks, including risk of serious injury.</p>
                    <p>I am competent to operate a bicycle, will obey all traffic laws, and will use appropriate safety equipment.</p>
                    <p>I accept full responsibility for my actions during this test ride and agree to return the bicycle by the agreed time in the same condition received.</p>
                    <p>I release and hold harmless San Diego Electric Bike, its owners and employees from any and all claims arising from my participation.</p>
                    <p>By agreeing below, I acknowledge I have read and accept the terms above.</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox id="waiver-agree" checked={formData.waiver_signed} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, waiver_signed: checked as boolean }))} />
                      <Label htmlFor="waiver-agree">I have read and agree to the waiver terms</Label>
                    </div>
                  </div>
                  <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                    <Button variant="outline" onClick={() => setIsWaiverOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      // capture timestamp best-effort here so it reaches DB later
                      if (!formData.waiver_signed) return
                      const submittedAt = new Date().toISOString()
                      // IP will be best-effort later (server side or external service)
                      setFormData(prev => ({ ...prev, submitted_at: submittedAt } as any))
                      setIsWaiverOpen(false)
                    }} disabled={!formData.waiver_signed}>Accept & Close</Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}