import AdminDashboardPage from '@/app/admin/page'

interface AdminPageProps {
  params: {
    slug: string
  }
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { slug } = await params
  
  // For now, just render the original admin component
  // This keeps everything working exactly as it was
  return <AdminDashboardPage />
}