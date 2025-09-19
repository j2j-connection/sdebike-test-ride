import TestDriveWidget from "@/components/TestDriveWidget"
import { getShopBySlug } from "@/lib/services/shopService"

export default async function Home() {
  // Default to SD Electric Bike for homepage
  const shop = await getShopBySlug('sd-electric-bike')

  if (!shop) {
    return <div>Error loading shop</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <TestDriveWidget shop={shop} />
    </main>
  )
}
