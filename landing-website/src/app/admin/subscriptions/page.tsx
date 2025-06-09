'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, User, CreditCard, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PendingSubscription {
  subscription: {
    id: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
  }
  user: {
    id: string
    name: string
    email: string
  }
  plan: {
    displayName: string
    price: number
    currency: string
    billingCycle: string
  }
  invoice: {
    id: string
    invoiceNumber: string
    amount: number
    currency: string
    issueDate: string
    dueDate: string
  }
}

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<PendingSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<PendingSubscription | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchPendingSubscriptions()
  }, [session, status])

  const fetchPendingSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } else {
        toast({
          title: "Error",
          description: "Failed to load pending subscriptions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast({
        title: "Error",
        description: "Failed to load pending subscriptions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedSubscription) return

    setActionLoading(selectedSubscription.subscription.id)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.subscription.id,
          action,
          notes: actionNotes
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Subscription ${action}d successfully`
        })
        setShowDialog(false)
        setActionNotes('')
        setSelectedSubscription(null)
        fetchPendingSubscriptions() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} subscription`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openActionDialog = (subscription: PendingSubscription, type: 'approve' | 'reject') => {
    setSelectedSubscription(subscription)
    setActionType(type)
    setShowDialog(true)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pending subscriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Subscription Management
        </h1>
        <p className="text-muted-foreground">
          Review and approve pending subscription activations
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Subscriptions</h3>
            <p className="text-muted-foreground">All subscriptions are up to date!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((sub) => (
            <Card key={sub.subscription.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {sub.plan.displayName} Subscription
                      </CardTitle>
                      <CardDescription>
                        Invoice #{sub.invoice.invoiceNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Pending Activation
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Customer Details</span>
                    </div>
                    
                    <div className="pl-6 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{sub.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{sub.user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Requested:</span>
                        <span>{formatDate(sub.subscription.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Info */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Billing Details</span>
                    </div>
                    
                    <div className="pl-6 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="font-medium">{sub.plan.displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Billing:</span>
                        <span>{sub.plan.billingCycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(sub.invoice.amount, sub.invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="text-orange-600">
                          {formatDate(sub.invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => openActionDialog(sub, 'reject')}
                    disabled={actionLoading === sub.subscription.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => openActionDialog(sub, 'approve')}
                    disabled={actionLoading === sub.subscription.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Activate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Subscription
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will activate the subscription and mark the invoice as paid.'
                : 'This will cancel the subscription and void the invoice.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'approve' 
                    ? 'Payment verification notes...'
                    : 'Reason for rejection...'
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAction(actionType)}
                disabled={actionLoading !== null}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionLoading !== null ? 'Processing...' : `${actionType === 'approve' ? 'Approve' : 'Reject'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
