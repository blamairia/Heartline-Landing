'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  billingCycle: 'MONTHLY' | 'ANNUAL'
  features: string[]
}

interface SubscriptionAddon {
  id: string
  subscription: string
  addon: {
    id: string
    name: string
    description: string
    price: number
    category: string
  }
  quantity: number
  isActive: boolean
}

interface SubscriptionUsage {
  id: string
  subscription: string
  feature: string
  usage: number
  limit: number | null
  period: string
}

interface SubscriptionBilling {
  id: string
  subscription: string
  nextPaymentDate: string | null
  lastPaymentDate: string | null
  paymentMethod: string | null
  billingAddress: any
}

interface Subscription {
  id: string
  userId: string
  planId: string
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'PAUSED'
  startDate: string
  endDate: string | null
  plan: SubscriptionPlan
  addons: SubscriptionAddon[]
  usage: SubscriptionUsage[]
  billing: SubscriptionBilling
  totalMonthlyCost: number
}

interface SubscriptionResponse {
  subscription: Subscription | null
  hasActiveSubscription: boolean
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/dashboard/subscription')
        if (!response.ok) {
          throw new Error('Failed to fetch subscription data')
        }
        const data = await response.json()
        setSubscription(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription')
        console.error('Error fetching subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !subscription) {
    return (
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32 text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span className="text-sm">{error || 'Failed to load subscription'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No active subscription
  if (!subscription.hasActiveSubscription || !subscription.subscription) {
    return (
      <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              No Active Subscription
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-gray-600 text-sm">Subscribe to access premium features</p>
            <Button className="w-full" size="sm" asChild>
              <Link href="/pricing">
                Choose a Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sub = subscription.subscription
  const ecgUsage = sub.usage.find(u => u.feature === 'ECG_ANALYSIS')
  const patientUsage = sub.usage.find(u => u.feature === 'PATIENT_CREATION')

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-gray-900">
            {sub.plan.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatPrice(sub.plan.price, sub.plan.currency)}
              <span className="text-sm font-normal text-gray-600">
                /{sub.plan.billingCycle.toLowerCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">Current billing cycle</p>
          </div>

          <div className="space-y-2">
            {ecgUsage && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">
                  {ecgUsage.usage} ECG analyses this month
                </span>
              </div>
            )}
            {patientUsage && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">
                  {patientUsage.usage} patients created this month
                </span>
              </div>
            )}
            {sub.addons.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">
                  {sub.addons.length} active addon{sub.addons.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>          <div className="pt-4 space-y-2">
            <Button className="w-full" size="sm" asChild>
              <Link href="/pricing">
                Upgrade Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/dashboard/subscription">
                Manage Subscription
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Status: <span className="capitalize">{sub.status.toLowerCase()}</span>
            {sub.billing.nextPaymentDate && (
              <> • Next billing: {formatDate(sub.billing.nextPaymentDate)}</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
