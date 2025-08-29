import TestDriveWidget from '@/components/TestDriveWidget'

interface ShopPageProps {
  params: {
    slug: string
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  // For SD Electric Bike, just use the original widget exactly as it was
  return <TestDriveWidget />
}