import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { SubscriptionCard } from '@/components/dashboard/subscription-card'

export const metadata: Metadata = {
  title: 'Dashboard | Hearline AI',
  description: 'Your Hearline AI subscription dashboard - manage your plan, users, and access powerful cardiac analysis tools.',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name || 'User'}
          </h1>
          <p className="text-gray-600">
            Manage your Hearline AI subscription and access powerful cardiac analysis tools.
          </p>
        </div>

        {/* Stats Overview */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <RecentActivity />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <QuickActions />
            <SubscriptionCard />
          </div>
        </div>
      </main>
    </div>
  )
}
