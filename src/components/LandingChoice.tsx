"use client"

import React from 'react'
import Link from 'next/link'
import { Shop } from '@/lib/services/shopService'
import { getThemeClasses } from '@/lib/theme'
import { Clock, Bike, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LandingChoiceProps {
  shop: Shop
}

export default function LandingChoice({ shop }: LandingChoiceProps) {
  const themeClasses = getThemeClasses(shop)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-2">
      <div className="max-w-md mx-auto w-full">
        {/* Header - matching TestDriveWidget style */}
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
            <p className="text-sm opacity-90">Choose Your Experience</p>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="space-y-4 pb-4">
          {/* Test Ride Option */}
          <Link href={`/shop/${shop.slug}/test-ride`}>
            <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all cursor-pointer shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">Test Ride</h2>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Rental Option */}
          <Link href={`/shop/${shop.slug}/rental`}>
            <Card className="border-2 border-slate-200 hover:border-green-500 transition-all cursor-pointer shadow-lg hover:shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bike className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">Rental</h2>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
