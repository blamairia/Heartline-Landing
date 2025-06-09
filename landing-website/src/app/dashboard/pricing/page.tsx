'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  billingCycle: string
  features: any
  trialDays: number | null
  isPopular: boolean
}

interface BillingAddress {
  firstName: string
  lastName: string
  phone: string
  organization: string
  address: string
  city: string
  wilaya: string
}

export default function DashboardPricingPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    address: '',
    city: '',
    wilaya: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowSubscriptionDialog(true)
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlan) return

    setCreating(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.name, // Send plan name instead of ID
          billingAddress
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription created successfully!"
        })
        setShowSubscriptionDialog(false)
        router.push('/dashboard/subscription')
      } else {
        throw new Error(result.message || 'Failed to create subscription')
      }
    } catch (error: any) {
      console.error('Subscription creation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price / 100)
  }

  const getFeaturesList = (features: any) => {
    if (!features) return []
    
    const featuresList = []
    if (features.maxUsers) featuresList.push(`Up to ${features.maxUsers} users`)
    if (features.maxECGAnalyses) featuresList.push(`${features.maxECGAnalyses} ECG analyses/month`)
    if (features.maxPatients) featuresList.push(`Up to ${features.maxPatients} patients`)
    if (features.supportLevel) featuresList.push(`${features.supportLevel} support`)
    
    return featuresList
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
            <p className="text-xl text-muted-foreground">
              Choose the perfect plan for your practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.isPopular 
                    ? 'border-primary shadow-xl scale-105' 
                    : 'border-gray-200'
                } hover:shadow-lg transition-all duration-300`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <div className="text-4xl font-bold text-primary mt-4">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{plan.billingCycle.toLowerCase()}
                    </span>
                  </div>
                  {plan.trialDays && (
                    <p className="text-sm text-muted-foreground">
                      {plan.trialDays}-day free trial
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {getFeaturesList(plan.features).map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.isPopular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.trialDays ? 'Start Free Trial' : 'Activate Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscription Creation Dialog */}
          <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Activate Subscription - {selectedPlan?.displayName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Plan Summary</h3>
                  <div className="flex justify-between">
                    <span>{selectedPlan?.displayName}</span>
                    <span className="font-semibold">
                      {selectedPlan && formatPrice(selectedPlan.price, selectedPlan.currency)}
                      /{selectedPlan?.billingCycle.toLowerCase()}
                    </span>
                  </div>
                  {selectedPlan?.trialDays && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Includes {selectedPlan.trialDays}-day free trial
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Billing Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={billingAddress.firstName}
                        onChange={(e) => setBillingAddress({...billingAddress, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={billingAddress.lastName}
                        onChange={(e) => setBillingAddress({...billingAddress, lastName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress({...billingAddress, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        value={billingAddress.organization}
                        onChange={(e) => setBillingAddress({...billingAddress, organization: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={billingAddress.address}
                        onChange={(e) => setBillingAddress({...billingAddress, address: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="wilaya">Wilaya</Label>
                      <Input
                        id="wilaya"
                        value={billingAddress.wilaya}
                        onChange={(e) => setBillingAddress({...billingAddress, wilaya: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubscription} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Activate Subscription
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
