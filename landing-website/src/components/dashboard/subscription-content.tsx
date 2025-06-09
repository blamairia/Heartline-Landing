'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/dashboard/ui/dialog'
import { Switch } from '@/components/dashboard/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Crown, CreditCard, Calendar, CheckCircle, AlertTriangle, Settings, Plus, Minus, Users, BarChart3, Shield, Phone, Loader2 } from 'lucide-react'

interface SubscriptionData {
  subscription: {
    id: string
    status: string
    plan: {
      id: string
      name: string
      displayName: string
      price: number
      currency: string
      billingCycle: string
      features: any
    }
    addons: Array<{
      id: string
      name: string
      displayName: string
      price: number
      quantity: number
      type: string
    }>
    billing: {
      startDate: string
      endDate: string
      nextPaymentDate: string
      lastPaymentDate: string | null
      totalMonthlyCost: number
      currency: string
      autoRenew: boolean
    }
    trial: {
      isTrialUsed: boolean
      trialStartDate: string | null
      trialEndDate: string | null
    }
    usage: Array<{
      feature: string
      usage: number
    }>
  } | null
  hasActiveSubscription: boolean
}

interface BillingData {
  paymentMethods: Array<{
    id: string
    type: string
    provider: string
    last4: string
    brand: string
    holderName: string
    isDefault: boolean
    display: string
  }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    amount: number
    currency: string
    status: string
    dueDate: string
    paidAt: string | null
    createdAt: string
    subscription: {
      plan: {
        displayName: string
      }
    }
  }>
  summary: {
    totalPaid: number
    pendingAmount: number
    nextPaymentAmount: number
    nextPaymentDate: string | null
  }
}

interface AvailablePlan {
  id: string
  name: string
  displayName: string
  price: number
  currency: string
  billingCycle: string
  features: any
  isPopular: boolean
}

export function SubscriptionContent() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [cancelReason, setCancelReason] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subResponse, billingResponse, plansResponse] = await Promise.all([
        fetch('/api/dashboard/subscription'),
        fetch('/api/dashboard/billing'),
        fetch('/api/subscription/plans')
      ])

      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubscriptionData(subData)
      }

      if (billingResponse.ok) {
        const billData = await billingResponse.json()
        setBillingData(billData)
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setAvailablePlans(plansData.plans || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionData?.subscription?.id) {
      toast({
        title: "Error",
        description: "Subscription ID not found. Cannot cancel.",
        variant: "destructive",
      })
      return
    }
    setActionLoading('cancel_subscription')
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscriptionData.subscription.id, 
          reason: cancelReason 
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message || "Subscription cancelled successfully.",
        })
        await fetchData() // Refresh data to reflect cancellation
        setShowCancelDialog(false)
        setCancelReason('')
      } else {
        throw new Error(result.error || "Failed to cancel subscription.")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/dashboard/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        await fetchData() // Refresh data
        setShowCancelDialog(false)
        setShowPlanChangeDialog(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform action",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount / 100) // Convert from cents
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, text: 'Active' },
      TRIAL: { variant: 'secondary' as const, text: 'Trial' },
      CANCELLED: { variant: 'destructive' as const, text: 'Cancelled' },
      EXPIRED: { variant: 'destructive' as const, text: 'Expired' },
      PENDING: { variant: 'default' as const, text: 'Pending' },
      PAID: { variant: 'default' as const, text: 'Paid' },
      OVERDUE: { variant: 'destructive' as const, text: 'Overdue' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, text: status }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getUsageProgress = (feature: string, usage: number, planFeatures: any) => {
    const limits = {
      'ECG_ANALYSIS': planFeatures?.maxECGAnalyses || 1000,
      'PATIENT_RECORDS': planFeatures?.maxPatients || 2000,
      'USERS': planFeatures?.maxUsers || 25
    }
    
    const limit = limits[feature as keyof typeof limits] || 1000
    const percentage = Math.min((usage / limit) * 100, 100)
    
    return { usage, limit, percentage }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!subscriptionData?.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">          <div className="text-center py-16">
            <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
            <p className="text-gray-600 mb-8">Get started with a subscription plan to access all features.</p>
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Available Plans
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const { subscription } = subscriptionData

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your plan, billing, and usage details.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Current Plan
                  {getStatusBadge(subscription!.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{subscription!.plan.displayName}</h3>
                    <p className="text-gray-600">
                      {subscription!.plan.billingCycle.toLowerCase()} billing
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(subscription!.billing.totalMonthlyCost, subscription!.plan.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      per {subscription!.plan.billingCycle.toLowerCase().slice(0, -2)}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Plan Features</h4>
                    <ul className="space-y-2">
                      {subscription!.plan.features?.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Usage This Month</h4>
                    <div className="space-y-3">
                      {subscription!.usage.map((usageItem, index) => {
                        const progress = getUsageProgress(usageItem.feature, usageItem.usage, subscription!.plan.features)
                        return (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{usageItem.feature.replace('_', ' ')}</span>
                              <span>{progress.usage} / {progress.limit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Active Addons */}
                {subscription!.addons.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Active Add-ons</h4>
                    <div className="grid gap-3">
                      {subscription!.addons.map((addon) => (
                        <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{addon.displayName}</span>
                            {addon.quantity > 1 && (
                              <span className="text-sm text-gray-600 ml-2">× {addon.quantity}</span>
                            )}
                          </div>
                          <span className="font-medium">
                            {formatCurrency(addon.price * addon.quantity, subscription!.plan.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 flex-wrap">
                  <Dialog open={showPlanChangeDialog} onOpenChange={setShowPlanChangeDialog}>
                    <DialogTrigger asChild>
                      <Button>Change Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Subscription Plan</DialogTitle>
                        <DialogDescription>
                          Select a new plan. Changes will take effect at your next billing cycle.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="plan">Select New Plan</Label>
                          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.displayName} - {formatCurrency(plan.price, plan.currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPlanChangeDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleAction('change_plan', { newPlanId: selectedPlan })}
                          disabled={!selectedPlan || actionLoading === 'change_plan'}
                        >
                          {actionLoading === 'change_plan' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Change Plan
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline"
                    onClick={() => handleAction('toggle_auto_renew', { subscriptionId: subscription!.id })}
                    disabled={actionLoading === 'toggle_auto_renew'}
                  >
                    {actionLoading === 'toggle_auto_renew' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {subscription!.billing.autoRenew ? 'Disable Auto-renew' : 'Enable Auto-renew'}
                  </Button>

                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Cancel Subscription</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your subscription? You'll lose access to all premium features.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reason">Reason for cancellation (optional)</Label>
                          <Textarea
                            id="reason"
                            placeholder="Help us improve by telling us why you're cancelling..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Keep Subscription
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleCancelSubscription} // Updated onClick handler
                          disabled={actionLoading === 'cancel_subscription'}
                        >
                          {actionLoading === 'cancel_subscription' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Cancel Subscription
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            {billingData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    Billing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingData.invoices.length > 0 ? (
                      billingData.invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatDate(invoice.createdAt)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {invoice.subscription?.plan?.displayName || 'Subscription'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </p>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No billing history available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {subscription!.billing.nextPaymentDate ? formatDate(subscription!.billing.nextPaymentDate) : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {formatCurrency(subscription!.billing.totalMonthlyCost, subscription!.billing.currency)} will be charged
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Switch 
                      checked={subscription!.billing.autoRenew} 
                      onCheckedChange={() => handleAction('toggle_auto_renew', { subscriptionId: subscription!.id })}
                      disabled={actionLoading === 'toggle_auto_renew'}
                    />
                    <span className="text-sm text-gray-600">Auto-renew</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="text-sm font-medium">{subscription!.plan.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(subscription!.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Started</span>
                  <span className="text-sm font-medium">{formatDate(subscription!.billing.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Renews</span>
                  <span className="text-sm font-medium">
                    {subscription!.billing.nextPaymentDate ? formatDate(subscription!.billing.nextPaymentDate) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions about your subscription? Our support team is here to help.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
