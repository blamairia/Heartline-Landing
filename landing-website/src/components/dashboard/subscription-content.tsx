'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Crown, CheckCircle, AlertTriangle, Plus, Clock, Loader2, FileText, Download, Printer } from 'lucide-react'

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
      const [subResponse, plansResponse] = await Promise.all([
        fetch('/api/dashboard/subscription'),
        fetch('/api/subscription/plans')
      ])

      if (subResponse.ok) {
        const subData = await subResponse.json()
        setSubscriptionData(subData)
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

  // Invoice printing functions
  const fetchInvoiceForSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/invoice`)
      if (response.ok) {
        const data = await response.json()
        return data.invoice
      } else {
        throw new Error('Invoice not found')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return null
    }
  }

  const handlePrintInvoice = async (subscriptionId: string, subscriptionName: string) => {
    setActionLoading(`print_invoice_${subscriptionId}`)
    try {
      const invoice = await fetchInvoiceForSubscription(subscriptionId)
      
      if (!invoice) {
        toast({
          title: "Error",
          description: "No invoice found for this subscription",
          variant: "destructive"
        })
        return
      }

      // Open invoice in new window for printing
      const invoiceWindow = window.open('', '_blank', 'width=800,height=600')
      if (invoiceWindow) {
        invoiceWindow.document.write(generateInvoiceHTML(invoice, subscriptionName))
        invoiceWindow.document.close()
        invoiceWindow.focus()
        invoiceWindow.print()
      }
      
      toast({
        title: "Success",
        description: "Invoice opened for printing"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to print invoice",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const generateInvoiceHTML = (invoice: any, subscriptionName: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          .details-section {
            margin: 30px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 8px;
          }
          .info-box h3 {
            margin-top: 0;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoice-table th,
          .invoice-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          .invoice-table th {
            background-color: #f9fafb;
            font-weight: bold;
          }
          .total-section {
            margin-top: 30px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            background-color: #3b82f6;
            color: white;
            padding: 15px;
            margin-top: 10px;
          }
          .payment-instructions {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .payment-instructions h3 {
            color: #1d4ed8;
            margin-top: 0;
          }
          .bank-details {
            background-color: white;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Hearline</h1>
            <p>Advanced Healthcare Solutions<br>
            Algiers, Algeria<br>
            contact@hearline.com</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">INVOICE</div>
            <div>${invoice.invoiceNumber}</div>
            <div style="margin-top: 10px;">
              <strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}<br>
              <strong>Due:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="info-box">
            <h3>Invoice To:</h3>
            <p><strong>User ID:</strong> ${invoice.userId}<br>
            <strong>Subscription:</strong> ${subscriptionName}</p>
          </div>
          
          <div class="info-box">
            <h3>Payment Details:</h3>
            <p><strong>Status:</strong> ${invoice.status}<br>
            <strong>Method:</strong> ${invoice.paymentProvider || 'Bank Transfer'}</p>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoiceItems?.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td>${formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            `).join('') || `
              <tr>
                <td>${invoice.description}</td>
                <td>1</td>
                <td>${formatCurrency(invoice.amount, invoice.currency)}</td>
                <td>${formatCurrency(invoice.amount, invoice.currency)}</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.amount, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(0, invoice.currency)}</span>
          </div>
          <div class="total-final">
            <div class="total-row" style="border: none; color: white;">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoice.amount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        ${invoice.status !== 'PAID' ? `
        <div class="payment-instructions">
          <h3>Payment Instructions</h3>
          <p>Please transfer the amount to the following bank account:</p>
          <div class="bank-details">
            <strong>Bank:</strong> CCP Algeria<br>
            <strong>Account Number:</strong> 1234567890123456<br>
            <strong>Reference:</strong> ${invoice.invoiceNumber}<br>
            <strong>Amount:</strong> ${formatCurrency(invoice.amount, invoice.currency)}
          </div>
          <p><strong>Important:</strong> Please include the invoice number (${invoice.invoiceNumber}) as the payment reference.</p>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Thank you for your business!<br>
          This invoice was generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `
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
                        {/* Invoice Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrintInvoice(subscription.id, subscription.planDisplayName)}
                            disabled={actionLoading === `print_invoice_${subscription.id}`}
                            className="flex-1"
                          >
                            {actionLoading === `print_invoice_${subscription.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Printer className="w-3 h-3" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrintInvoice(subscription.id, subscription.planDisplayName)}
                            disabled={actionLoading === `print_invoice_${subscription.id}`}
                            className="flex-1"
                          >
                            {actionLoading === `print_invoice_${subscription.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                          </Button>
                        </div>

                        {/* Subscription Actions */}
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
