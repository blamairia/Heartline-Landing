'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, FileText, Download, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  amount: number
  amountDue: number
  currency: string
  issueDate: string
  dueDate: string
  description: string
  subscription: {
    id: string
    plan: {
      displayName: string
      billingCycle: string
    }
  }
  invoiceItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

export default function InvoiceConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  const invoiceId = params.id as string

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchInvoice()
  }, [session, status, invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoice/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      } else {
        toast({
          title: "Error",
          description: "Failed to load invoice details",
          variant: "destructive"
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyBankDetails = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Bank details copied to clipboard"
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invoice not found</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscription Request Received!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your subscription is pending activation. Please complete the payment using the details below.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Details
              </CardTitle>
              <CardDescription>
                Invoice #{invoice.invoiceNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={invoice.status === 'OPEN' ? 'secondary' : 'default'}>
                  {invoice.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium text-orange-600">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                {invoice.invoiceItems.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Payment Instructions
              </CardTitle>
              <CardDescription>
                Complete your payment using bank transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Bank Transfer Details:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Bank Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">CCP Algeria</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyBankDetails('CCP Algeria')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">1234567890123456</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyBankDetails('1234567890123456')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Reference:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{invoice.invoiceNumber}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyBankDetails(invoice.invoiceNumber)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                  Important Notes:
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Include the invoice number as reference</li>
                  <li>• Payment must be received within 30 days</li>
                  <li>• Your subscription will be activated after payment confirmation</li>
                  <li>• Keep your payment receipt for records</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Make Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Transfer the amount to our bank account using the details provided
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Payment Review</h4>
                <p className="text-sm text-muted-foreground">
                  Our team will verify your payment within 1-2 business days
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Activation</h4>
                <p className="text-sm text-muted-foreground">
                  Your subscription will be activated and you'll receive a confirmation email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
