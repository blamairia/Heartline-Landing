'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Clock, DollarSign, Loader2, FileText, Plus } from 'lucide-react'
import { BillingResponse } from '@/types/api'

export function BillingManagement() {
  const [billingData, setBillingData] = useState<BillingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await fetch('/api/dashboard/billing')
        if (!response.ok) {
          throw new Error('Failed to fetch billing data')
        }
        const data: BillingResponse = await response.json()
        setBillingData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing')
        console.error('Error fetching billing:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBilling()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !billingData) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error || 'Failed to load billing'}</span>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-3 h-3 mr-1" />
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />
      case 'overdue':
        return <AlertCircle className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Billing & Invoices
        </h1>
        <p className="text-gray-600">
          Manage your payment methods, view billing history, and download invoices.
        </p>
      </div>      {/* Billing Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Pending Amount</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(billingData.summary.pendingAmount, billingData.summary.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Total Paid</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(billingData.summary.totalPaid, billingData.summary.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Total Invoices</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {billingData.invoices.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Overdue Amount</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(billingData.summary.overdueAmount, billingData.summary.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </span>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                    </p>                    <p className="text-sm text-gray-600">
                      Expires {method.expiryMonth?.toString().padStart(2, '0') || '??'}/{method.expiryYear || '????'}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Issued: {formatDate(invoice.date)}</p>
                    <p>Due: {formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(invoice.amount, invoice.currency)}
                    </p>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>      {/* Billing History Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(billingData.summary.totalPaid, billingData.summary.currency)}
              </div>
              <p className="text-sm text-gray-600">Total Paid</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(billingData.summary.pendingAmount, billingData.summary.currency)}
              </div>
              <p className="text-sm text-gray-600">Pending Amount</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(billingData.summary.overdueAmount, billingData.summary.currency)}
              </div>
              <p className="text-sm text-gray-600">Overdue Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
