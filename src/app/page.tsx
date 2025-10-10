import { redirect } from 'next/navigation'

export default async function Home() {
  // Root path redirects to default shop (handled by middleware)
  // This page should not be reached due to middleware redirect
  redirect('/shop/sd-electric-bike')
}
