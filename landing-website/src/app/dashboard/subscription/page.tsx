import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import dynamic from 'next/dynamic'

// Dynamically import the client component
const SubscriptionContent = dynamic(
  () => import('@/components/dashboard/subscription-content').then(mod => ({ default: mod.SubscriptionContent })),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Subscription | Heartline Dashboard',
  description: 'Manage your Heartline subscription and billing.',
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }
  return <SubscriptionContent />
}
