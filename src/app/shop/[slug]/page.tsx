import TestDriveWidget from '@/components/TestDriveWidget'
import { getShopBySlug } from '@/lib/services/shopService'
import { notFound } from 'next/navigation'

interface ShopPageProps {
  params: {
    slug: string
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