import TestDriveWidget from '@/components/TestDriveWidget'
import { getShopBySlug } from '@/lib/services/shopService'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface TestRidePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: TestRidePageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The requested shop could not be found.'
    }
  }

  return {
    title: `${shop.name} - Test Ride`,
    description: `Book your ${shop.name} test ride - Quick 30-minute test ride with $1 authorization hold.`,
    openGraph: {
      title: `${shop.name} - Test Ride`,
      description: `Book your ${shop.name} test ride - Quick 30-minute test ride with $1 authorization hold.`,
      siteName: shop.name
    }
  }
}

export default async function TestRidePage({ params }: TestRidePageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <TestDriveWidget shop={shop} />
    </main>
  )
}
