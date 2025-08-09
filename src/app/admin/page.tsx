"use client"

import React, { useEffect, useMemo, useState } from "react"
import { testDriveService } from "@/lib/services/testDriveService"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ActiveDriveItem {
  id: string
  customer: {
    id: string
    name: string
    phone: string
    email?: string | null
    id_photo_url?: string | null
    signature_data?: string | null
    waiver_url?: string | null
    waiver_signed: boolean
    submission_ip?: string | null
    submitted_at?: string | null
  }
  bike_model: string
  start_time?: string
  end_time?: string
  status: string
}

export default function AdminDashboardPage() {
  const [drives, setDrives] = useState<ActiveDriveItem[]>([])
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    try {
      const data = await testDriveService.getActiveTestDrives()
      setDrives(data as unknown as ActiveDriveItem[])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load() // fetch once; avoid polling that causes the UI to reset
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return drives
    return drives.filter(d =>
      d.customer.name.toLowerCase().includes(q) ||
      d.customer.phone.toLowerCase().includes(q) ||
      (d.bike_model || "").toLowerCase().includes(q)
    )
  }, [drives, query])

  const formatTime = (iso?: string) => {
    if (!iso) return "—"
    const date = new Date(iso)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleComplete = async (id: string) => {
    await testDriveService.completeTestDrive(id)
    await load()
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">SDEBIKE Admin</h1>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name, phone, bike..."
              className="h-10 w-64"
            />
            <Button onClick={load} className="h-10">Refresh</Button>
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {isLoading && (
                <div className="text-slate-500">Loading...</div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-slate-500">No active test rides.</div>
              )}
              {filtered.map((drive) => (
                <div key={drive.id} className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800">{drive.customer.name}</div>
                    <Badge variant="outline">{drive.bike_model}</Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div>Phone: <a href={`tel:${drive.customer.phone}`} className="text-blue-600 hover:underline">{drive.customer.phone}</a></div>
                    <div>Start: {formatTime(drive.start_time)}</div>
                    <div>Return by: {formatTime(drive.end_time)}</div>
                    {drive.customer.submitted_at && (
                      <div>Submitted: {new Date(drive.customer.submitted_at).toLocaleString()}</div>
                    )}
                    {drive.customer.submission_ip && (
                      <div>IP: {drive.customer.submission_ip}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 overflow-hidden">
                    {drive.customer.id_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={drive.customer.id_photo_url} alt="ID" className="w-20 h-20 object-cover rounded border" />
                    )}
                    {drive.customer.signature_data && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={drive.customer.signature_data} alt="Signature" className="h-20 max-w-[10rem] object-contain rounded border bg-white p-1" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(drive as any).customer.waiver_url ? (
                      <Button onClick={() => window.open((drive as any).customer.waiver_url, '_blank')}>Open Waiver</Button>
                    ) : (
                      <span className="text-xs text-slate-500">No waiver on file</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


