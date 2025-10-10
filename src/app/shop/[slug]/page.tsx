import TestDriveWidget from '@/components/TestDriveWidget'
import LandingChoice from '@/components/LandingChoice'
import { getShopBySlug } from '@/lib/services/shopService'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { FEATURES } from '@/config/features'

interface ShopPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The requested shop could not be found.'
    }
  }

  return {
    title: `${shop.name} - Test Rides & Rentals`,
    description: `Book your ${shop.name} test ride or rental - Digital sign-up with ID verification, waiver signing, and secure payment.`,
    openGraph: {
      title: `${shop.name} - Test Rides & Rentals`,
      description: `Book your ${shop.name} test ride or rental - Digital sign-up with ID verification, waiver signing, and secure payment.`,
      siteName: shop.name
    }
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    notFound()
  }

  // If rental choice is enabled, show landing page
  if (FEATURES.showRentalChoice && FEATURES.enableRentals && FEATURES.enableTestRides) {
    return <LandingChoice shop={shop} />
  }

  // Otherwise, show test ride widget (legacy behavior)
  return <TestDriveWidget shop={shop} />
}