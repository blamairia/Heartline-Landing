import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SubscriptionContent } from '@/components/dashboard/subscription-content'

export const metadata: Metadata = {
  title: 'Subscription | Hearline Dashboard',
  description: 'Manage your Hearline subscription and billing.',
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }
  return <SubscriptionContent />
}
