import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AddonsManagement } from '@/components/dashboard/addons-management'

export const metadata: Metadata = {
  title: 'Add-ons | Hearline Dashboard',
  description: 'Manage add-ons and additional features for your Hearline subscription.',
}

export default async function AddonsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <AddonsManagement />
      </main>
    </div>
  )
}
