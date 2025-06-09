'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function PricingContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9900,
      currency: 'DZD',
      billing: 'month',
      features: [
        'Up to 100 ECG analyses per month',
        'Basic patient management',
        'Email support',
        'Mobile app access'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 29900,
      currency: 'DZD',
      billing: 'month',
      features: [
        'Up to 500 ECG analyses per month',
        'Advanced patient management',
        'Priority support',
        'API access',
        'Custom reports'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99900,
      currency: 'DZD',
      billing: 'month',
      features: [
        'Unlimited ECG analyses',
        'Full patient management suite',
        '24/7 dedicated support',
        'Custom integrations',
        'White-label options'
      ]
    }
  ]

  const handlePlanSelect = (planId: string) => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/pricing')
      return
    }
    
    // For demo purposes, simulate subscription
    setLoading(true)
    setTimeout(() => {
      alert(`Subscription to ${planId} plan activated! (Demo mode)`)
      setLoading(false)
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            Choose Your Perfect Plan
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Start with a free trial and upgrade anytime. All plans include our core ECG analysis features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'white',
                border: plan.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '2rem',
                position: 'relative',
                boxShadow: plan.popular ? '0 10px 25px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Most Popular
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827' }}>
                    {(plan.price / 100).toFixed(0)}
                  </span>
                  <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>
                    DZD/{plan.billing}
                  </span>
                </div>
              </div>

              <ul style={{ marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#10b981', marginRight: '0.75rem', fontSize: '1.25rem' }}>✓</span>
                    <span style={{ color: '#374151' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: plan.popular ? '#3b82f6' : 'white',
                  color: plan.popular ? 'white' : '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {loading ? 'Processing...' : session ? 'Get Started' : 'Sign Up to Continue'}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '2rem' }}>
            All plans include
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔬</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Premium ECG Analysis</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Advanced AI-powered ECG interpretation</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Patient Management</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Complete patient record system</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Secure & Compliant</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>HIPAA compliant data protection</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📞</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>24/7 Support</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Expert technical support</p>
            </div>
          </div>        </div>
      </div>
    </div>
  )
}

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

  const updateBillingForm = (field: keyof BillingForm, value: string) => {
    setBillingForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubscribe = async () => {
    if (!selectedPlan || !session) return

    setSubscriptionLoading(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingInfo: billingForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success!",
          description: `Successfully subscribed to ${selectedPlan.displayName}. Invoice ID: ${data.invoiceId}`,
          variant: "default"
        })
        setShowSubscriptionDialog(false)
        router.push('/dashboard?tab=subscription')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create subscription",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive"
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const wilayaOptions = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
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
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    ⭐ Most Popular
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
                      <span className="w-5 h-5 text-green-500 flex-shrink-0">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  
                  {/* Plan limits */}
                  {plan.features?.maxECGAnalyses && (
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 text-green-500 flex-shrink-0">✓</span>
                      <span className="text-gray-700">
                        {plan.features.maxECGAnalyses === -1 ? 'Unlimited' : plan.features.maxECGAnalyses} ECG analyses
                      </span>
                    </li>
                  )}
                  
                  {plan.features?.maxPatients && (
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 text-green-500 flex-shrink-0">✓</span>
                      <span className="text-gray-700">
                        {plan.features.maxPatients === -1 ? 'Unlimited' : plan.features.maxPatients} patients
                      </span>
                    </li>
                  )}
                  
                  {plan.features?.maxUsers && (
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 text-green-500 flex-shrink-0">✓</span>
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Premium ECG Analysis</h3>
              <p className="text-gray-600 text-sm">Advanced AI-powered ECG interpretation</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Patient Management</h3>
              <p className="text-gray-600 text-sm">Complete patient record system</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
              <p className="text-gray-600 text-sm">HIPAA compliant data protection</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
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
                <span className="text-xl">🏢</span>
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
                <span className="text-xl">💳</span>
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
              {subscriptionLoading && (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Complete Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
