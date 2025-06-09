'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  billingCycle: string
  features: any
  isPopular: boolean
}

interface BillingFormData {
  firstName: string
  lastName: string
  phone: string
  organization: string
  address: string
  city: string
  wilaya: string
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState<BillingFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    address: '',
    city: '',
    wilaya: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      const data = await response.json()
      
      if (response.ok) {
        setPlans(data.plans || [])
      } else {
        throw new Error('Failed to fetch plans')
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
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    setSelectedPlan(plan)
    setShowDialog(true)
  }

  const handleFormChange = (field: keyof BillingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitSubscription = async () => {
    if (!selectedPlan) return

    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'wilaya']
    const missingFields = requiredFields.filter(field => !formData[field as keyof BillingFormData])
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.name, // Use plan name as ID
          billingAddress: formData
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription created successfully!"
        })
        setShowDialog(false)
        router.push('/dashboard/subscription')
      } else {
        throw new Error(result.message || 'Failed to create subscription')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: currency || 'DZD',
      minimumFractionDigits: 0
    }).format(price / 100)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Flexible pricing options designed to scale with your practice. 
            Start with a 30-day free trial, no credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.isPopular 
                  ? 'border-primary shadow-xl scale-105' 
                  : 'border-gray-200 shadow-lg'
              } hover:shadow-xl transition-all duration-300`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{plan.billingCycle.toLowerCase()}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features && typeof plan.features === 'object' && (
                    <>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Up to {plan.features.maxUsers} users</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>{plan.features.maxECGAnalyses === -1 ? 'Unlimited' : plan.features.maxECGAnalyses} ECG analyses</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>{plan.features.maxPatients === -1 ? 'Unlimited' : plan.features.maxPatients} patients</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>{plan.features.supportLevel || 'Email'} support</span>
                      </li>
                    </>
                  )}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {session ? 'Subscribe Now' : 'Sign Up & Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription Creation Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Subscription</DialogTitle>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">{selectedPlan.displayName}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(selectedPlan.price, selectedPlan.currency)}
                    <span className="text-sm font-normal text-gray-600">
                      /{selectedPlan.billingCycle.toLowerCase()}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Billing Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => handleFormChange('organization', e.target.value)}
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wilaya">Wilaya *</Label>
                      <Input
                        id="wilaya"
                        value={formData.wilaya}
                        onChange={(e) => handleFormChange('wilaya', e.target.value)}
                        placeholder="Enter wilaya"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitSubscription}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Subscribe Now
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Money-back guarantee */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  )
}
