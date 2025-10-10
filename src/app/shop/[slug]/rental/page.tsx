import RentalWidget from '@/components/RentalWidget'
import { getShopBySlug } from '@/lib/services/shopService'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface RentalPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: RentalPageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The requested shop could not be found.'
    }
  }

  return {
    title: `${shop.name} - Hourly Rental`,
    description: `Rent by the hour from ${shop.name} - Choose your bike and duration, from $25/hour.`,
    openGraph: {
      title: `${shop.name} - Hourly Rental`,
      description: `Rent by the hour from ${shop.name} - Choose your bike and duration, from $25/hour.`,
      siteName: shop.name
    }
  }
}

export default async function RentalPage({ params }: RentalPageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)

  if (!shop) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <RentalWidget shop={shop} />
    </main>
  )
}
