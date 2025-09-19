import TestDriveWidget from '@/components/TestDriveWidget'
import { getShopBySlug } from '@/lib/services/shopService'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

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
    title: `${shop.name} Test Ride`,
    description: `Book your ${shop.name} test ride - Digital sign-up with ID verification, waiver signing, and secure payment authorization.`,
    openGraph: {
      title: `${shop.name} Test Ride`,
      description: `Book your ${shop.name} test ride - Digital sign-up with ID verification, waiver signing, and secure payment authorization.`,
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

  return <TestDriveWidget shop={shop} />
}