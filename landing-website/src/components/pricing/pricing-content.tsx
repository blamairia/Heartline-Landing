'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Crown, Star, Loader2, CreditCard, Building, MapPin, Phone, Mail } from 'lucide-react'

interface Plan {
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

interface BillingForm {
  billingName: string
  billingEmail: string
  billingPhone: string
  company: string
  address: string
  city: string
  wilaya: string
  postalCode: string
  country: string
}

export function PricingContent() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [billingForm, setBillingForm] = useState<BillingForm>({
    billingName: '',
    billingEmail: '',
    billingPhone: '',
    company: '',
    address: '',
    city: '',
    wilaya: '',
    postalCode: '',
    country: 'Algeria'
  })
  
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast({
        title: "Error",
        description: "Failed to load pricing plans",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount / 100)
  }

  const handlePlanSelect = (plan: Plan) => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/pricing')
      return
    }
    
    setSelectedPlan(plan)
    setBillingForm(prev => ({
      ...prev,
      billingName: session.user?.name || '',
      billingEmail: session.user?.email || ''
    }))
    setShowSubscriptionDialog(true)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return
    
    setSubscriptionLoading(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingInfo: billingForm
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Subscription created successfully. You can now access all features.",
        })
        setShowSubscriptionDialog(false)
        router.push('/dashboard/subscription')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const updateBillingForm = (field: keyof BillingForm, value: string) => {
    setBillingForm(prev => ({ ...prev, [field]: value }))
  }

  const wilayaOptions = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", 
    "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
    "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
    "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
    "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
    "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
    "Ghardaïa", "Relizane"
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start with a free trial and upgrade anytime. All plans include our core ECG analysis features.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-primary shadow-lg' : 'border-gray-200'}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.displayName}</CardTitle>
                <p className="text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{plan.billingCycle.toLowerCase().slice(0, -2)}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features?.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  
                  {/* Plan limits */}
                  {plan.features?.maxECGAnalyses && (
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        {plan.features.maxECGAnalyses === -1 ? 'Unlimited' : plan.features.maxECGAnalyses} ECG analyses
                      </span>
                    </li>
                  )}
                  
                  {plan.features?.maxPatients && (
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        {plan.features.maxPatients === -1 ? 'Unlimited' : plan.features.maxPatients} patients
                      </span>
                    </li>
                  )}
                  
                  {plan.features?.maxUsers && (
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        Up to {plan.features.maxUsers} users
                      </span>
                    </li>
                  )}
                </ul>

                <Button 
                  className="w-full" 
                  size="lg"
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {session ? 'Get Started' : 'Sign Up to Continue'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            All plans include
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Premium ECG Analysis</h3>
              <p className="text-gray-600 text-sm">Advanced AI-powered ECG interpretation</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Patient Management</h3>
              <p className="text-gray-600 text-sm">Complete patient record system</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
              <p className="text-gray-600 text-sm">HIPAA compliant data protection</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Expert technical support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              Subscribe to {selectedPlan?.displayName} for {formatCurrency(selectedPlan?.price || 0, selectedPlan?.currency)} per {selectedPlan?.billingCycle.toLowerCase().slice(0, -2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Billing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5" />
                Billing Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingName">Full Name *</Label>
                  <Input
                    id="billingName"
                    value={billingForm.billingName}
                    onChange={(e) => updateBillingForm('billingName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billingEmail">Email *</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={billingForm.billingEmail}
                    onChange={(e) => updateBillingForm('billingEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billingPhone">Phone</Label>
                  <Input
                    id="billingPhone"
                    value={billingForm.billingPhone}
                    onChange={(e) => updateBillingForm('billingPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Practice</Label>
                  <Input
                    id="company"
                    value={billingForm.company}
                    onChange={(e) => updateBillingForm('company', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={billingForm.address}
                  onChange={(e) => updateBillingForm('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={billingForm.city}
                    onChange={(e) => updateBillingForm('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="wilaya">Wilaya *</Label>
                  <Select value={billingForm.wilaya} onValueChange={(value) => updateBillingForm('wilaya', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wilaya" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayaOptions.map((wilaya) => (
                        <SelectItem key={wilaya} value={wilaya}>
                          {wilaya}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={billingForm.postalCode}
                    onChange={(e) => updateBillingForm('postalCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Simulation Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Payment Simulation</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    This is a demo environment. Your subscription will be activated immediately 
                    and an invoice will be generated for testing purposes. No actual payment will be processed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubscribe}
              disabled={subscriptionLoading || !billingForm.billingName || !billingForm.billingEmail || !billingForm.address || !billingForm.city || !billingForm.wilaya}
            >
              {subscriptionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
