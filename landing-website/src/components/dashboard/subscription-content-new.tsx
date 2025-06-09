'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Crown, CreditCard, Calendar, CheckCircle, AlertTriangle, Settings, Plus, Clock, Users, BarChart3, Shield, Phone, Loader2 } from 'lucide-react'

interface SubscriptionData {
  subscriptions: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    trialStart: string | null
    trialEnd: string | null
    autoRenew: boolean
    createdAt: string
    updatedAt: string
    cancelledAt: string | null
    cancellationReason: string | null
    paymentProvider: string | null
    offlinePaymentReference: string | null
    planId: string
    planName: string
    planDisplayName: string
    planPrice: number
    planCurrency: string
    planBillingCycle: string
    planFeatures: any
    addons: Array<{
      id: string
      quantity: number
      priceAtPurchase: number
      status: string
      addonDisplayName: string
      addonDescription: string
    }>
  }>
  activeSubscription: {
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
    currentPeriodStart: string
    currentPeriodEnd: string
    trialStart: string | null
    trialEnd: string | null
    autoRenew: boolean
    createdAt: string
  } | null
  hasActiveSubscription: boolean
  totalSubscriptions: number
  summary: {
    active: number
    pending: number
    cancelled: number
    trialing: number
  }
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
    description?: string
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
  const [selectedSubscription, setSelectedSubscription] = useState<string>('')
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
    if (!selectedSubscription) {
      toast({
        title: "Error",
        description: "No subscription selected for cancellation.",
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
          subscriptionId: selectedSubscription, 
          reason: cancelReason 
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message || "Subscription cancelled successfully.",
        })
        
        await fetchData() // Refresh data
        setShowCancelDialog(false)
        setSelectedSubscription('')
        setCancelReason('')
      } else {
        throw new Error(result.message || 'Failed to cancel subscription')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
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
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency === 'DZD' ? 'DZD' : 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100)
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
      TRIALING: { variant: 'secondary' as const, text: 'Trial' },
      PENDING_ACTIVATION: { variant: 'outline' as const, text: 'Pending' },
      CANCELLED: { variant: 'destructive' as const, text: 'Cancelled' },
      EXPIRED: { variant: 'destructive' as const, text: 'Expired' },
      PENDING_PAYMENT: { variant: 'outline' as const, text: 'Pending Payment' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, text: status }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading subscription data...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Subscription Data</h1>
            <p className="text-gray-600 mb-6">Unable to load subscription information.</p>
            <Button onClick={fetchData}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage all your subscriptions, view invoices, and billing details.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptionData.totalSubscriptions}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{subscriptionData.summary.active}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{subscriptionData.summary.pending}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-600">{subscriptionData.summary.cancelled}</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Subscription Highlight */}
        {subscriptionData.activeSubscription && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Current Active Subscription
                <Badge variant="default">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {subscriptionData.activeSubscription.plan.displayName}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {subscriptionData.activeSubscription.plan.billingCycle.toLowerCase()} billing
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(subscriptionData.activeSubscription.plan.price, subscriptionData.activeSubscription.plan.currency)}
                  </p>
                </div>
                
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Started:</span>
                      <span className="text-sm font-medium">{formatDate(subscriptionData.activeSubscription.currentPeriodStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ends:</span>
                      <span className="text-sm font-medium">{formatDate(subscriptionData.activeSubscription.currentPeriodEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Auto Renew:</span>
                      <Badge variant={subscriptionData.activeSubscription.autoRenew ? "default" : "secondary"}>
                        {subscriptionData.activeSubscription.autoRenew ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedSubscription(subscriptionData.activeSubscription!.id)
                    setShowCancelDialog(true)
                  }}>
                    Cancel Subscription
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowPlanChangeDialog(true)}>
                    Change Plan
                  </Button>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="w-full">
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Subscriptions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Subscriptions</span>
              <Link href="/pricing">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Subscription
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData.subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscriptions</h3>
                <p className="text-gray-600 mb-4">You don't have any subscriptions yet.</p>
                <Link href="/pricing">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptionData.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {subscription.planDisplayName}
                          </h3>
                          {getStatusBadge(subscription.status)}
                          {subscription.status === 'ACTIVE' && (
                            <Badge variant="outline" className="text-primary border-primary">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Price:</span>
                            <p className="font-medium">{formatCurrency(subscription.planPrice, subscription.planCurrency)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Billing:</span>
                            <p className="font-medium">{subscription.planBillingCycle}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Created:</span>
                            <p className="font-medium">{formatDate(subscription.createdAt)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Period:</span>
                            <p className="font-medium">
                              {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                            </p>
                          </div>
                        </div>

                        {subscription.paymentProvider && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">Payment Method: </span>
                            <Badge variant="outline">{subscription.paymentProvider}</Badge>
                            {subscription.offlinePaymentReference && (
                              <span className="ml-2 text-sm text-gray-600">
                                Ref: {subscription.offlinePaymentReference}
                              </span>
                            )}
                          </div>
                        )}

                        {subscription.cancellationReason && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">Cancellation Reason: </span>
                            <span className="text-sm text-gray-900">{subscription.cancellationReason}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {subscription.status === 'ACTIVE' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedSubscription(subscription.id)
                              setShowCancelDialog(true)
                            }}>
                              Cancel
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowPlanChangeDialog(true)}>
                              Change Plan
                            </Button>
                          </>
                        )}
                        
                        {subscription.status === 'PENDING_ACTIVATION' && (
                          <Badge variant="secondary" className="text-center">
                            Awaiting Payment
                          </Badge>
                        )}
                        
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this subscription? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Subscription
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel_subscription'}
              >
                {actionLoading === 'cancel_subscription' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Plan Change Dialog */}
        <Dialog open={showPlanChangeDialog} onOpenChange={setShowPlanChangeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Plan</DialogTitle>
              <DialogDescription>
                Select a new plan to upgrade or downgrade your subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPlan">Select Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.displayName} - {formatCurrency(plan.price, plan.currency)}/{plan.billingCycle}
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
                onClick={() => handleAction('change_plan', { planId: selectedPlan })}
                disabled={!selectedPlan || actionLoading === 'change_plan'}
              >
                {actionLoading === 'change_plan' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Plan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
