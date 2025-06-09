'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Building, User, MapPin, Check, AlertCircle } from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  billingCycle: string
  isPopular: boolean
  features: any
}

interface Addon {
  id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  type: string
}

export default function CreateSubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedAddons, setSelectedAddons] = useState<{addonId: string, quantity: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    address: '',
    city: '',
    wilaya: '',
    phone: ''
  })

  const [paymentMethod, setPaymentMethod] = useState({
    type: 'CREDIT_CARD',
    holderName: '',
    last4: '',
    brand: 'visa',
    expiryMonth: '',
    expiryYear: '',
    provider: 'stripe'
  })

  const [simulatePayment, setSimulatePayment] = useState(true)

  useEffect(() => {
    fetchPlansAndAddons()
  }, [])

  const fetchPlansAndAddons = async () => {
    try {
      // Fetch plans
      const plansResponse = await fetch('/api/test/dashboard-data')
      const plansData = await plansResponse.json()
      
      // For this demo, we'll create mock plans
      const mockPlans: SubscriptionPlan[] = [
        {
          id: 'starter',
          name: 'starter',
          displayName: 'Starter Plan',
          description: 'Perfect for small practices',
          price: 9900,
          currency: 'DZD',
          billingCycle: 'MONTHLY',
          isPopular: false,
          features: { maxUsers: 5, maxECGAnalyses: 100 }
        },
        {
          id: 'professional', 
          name: 'professional',
          displayName: 'Professional Plan',
          description: 'Ideal for growing practices',
          price: 29900,
          currency: 'DZD',
          billingCycle: 'MONTHLY',
          isPopular: true,
          features: { maxUsers: 25, maxECGAnalyses: 1000 }
        },
        {
          id: 'enterprise',
          name: 'enterprise', 
          displayName: 'Enterprise Plan',
          description: 'For large organizations',
          price: 59900,
          currency: 'DZD',
          billingCycle: 'MONTHLY',
          isPopular: false,
          features: { maxUsers: -1, maxECGAnalyses: -1 }
        }
      ]

      const mockAddons: Addon[] = [
        {
          id: 'advanced-analytics',
          name: 'advanced_analytics',
          displayName: 'Advanced Analytics',
          description: 'Advanced ECG analysis algorithms',
          price: 4900,
          currency: 'DZD',
          type: 'FEATURE'
        },
        {
          id: 'extra-users',
          name: 'extra_users',
          displayName: 'Additional Users',
          description: 'Add more users to your subscription',
          price: 990,
          currency: 'DZD',
          type: 'USAGE'
        }
      ]

      setPlans(mockPlans)
      setAddons(mockAddons)
    } catch (err) {
      setError('Failed to load plans and addons')
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100)
  }

  const calculateTotal = () => {
    const selectedPlanObj = plans.find(p => p.id === selectedPlan)
    if (!selectedPlanObj) return 0

    const planCost = selectedPlanObj.price
    const addonsCost = selectedAddons.reduce((sum, addon) => {
      const addonObj = addons.find(a => a.id === addon.addonId)
      return sum + (addonObj ? addonObj.price * addon.quantity : 0)
    }, 0)

    return planCost + addonsCost
  }

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev => {
      const existing = prev.find(a => a.addonId === addonId)
      if (existing) {
        return prev.filter(a => a.addonId !== addonId)
      } else {
        return [...prev, { addonId, quantity: 1 }]
      }
    })
  }

  const handleAddonQuantityChange = (addonId: string, quantity: number) => {
    setSelectedAddons(prev => 
      prev.map(addon => 
        addon.addonId === addonId 
          ? { ...addon, quantity: Math.max(1, quantity) }
          : addon
      )
    )
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlan) {
      setError('Please select a plan')
      return
    }

    if (!billingAddress.firstName || !billingAddress.lastName || !billingAddress.address) {
      setError('Please fill in all required billing address fields')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan,
          addons: selectedAddons,
          billingAddress,
          paymentMethod: paymentMethod.type ? paymentMethod : null,
          simulatePayment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="w-5 h-5" />
              Subscription Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Subscription ID:</strong>
                <p className="font-mono">{result.data.subscriptionId}</p>
              </div>
              <div>
                <strong>Invoice Number:</strong>
                <p className="font-mono">{result.data.invoiceNumber}</p>
              </div>
              <div>
                <strong>Total Cost:</strong>
                <p>{formatPrice(result.data.totalCost, result.data.currency)}</p>
              </div>
              <div>
                <strong>Payment Status:</strong>
                <Badge className={result.data.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {result.data.paymentStatus}
                </Badge>
              </div>
              <div>
                <strong>Next Payment:</strong>
                <p>{new Date(result.data.nextPaymentDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            {result.data.paymentMethod && (
              <div className="mt-4 p-3 bg-white rounded border">
                <strong>Payment Method:</strong>
                <p>{result.data.paymentMethod.display}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => {setResult(null); setError(null)}}>
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Subscription
        </h1>
        <p className="text-gray-600">
          Choose a plan, add billing information, and simulate payment processing.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Choose Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.isPopular ? 'ring-2 ring-orange-200' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-2 left-4 bg-orange-500">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{plan.displayName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                  <div className="text-2xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-sm font-normal text-gray-600">
                      /{plan.billingCycle.toLowerCase()}
                    </span>
                  </div>
                </div>

                {selectedPlan === plan.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Addons Selection */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>2. Add-ons (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {addons.map(addon => {
                const selected = selectedAddons.find(a => a.addonId === addon.id)
                return (
                  <div key={addon.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={!!selected}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <div>
                        <h4 className="font-medium">{addon.displayName}</h4>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selected && addon.type === 'USAGE' && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`quantity-${addon.id}`} className="text-sm">Qty:</Label>
                          <Input
                            id={`quantity-${addon.id}`}
                            type="number"
                            min="1"
                            value={selected.quantity}
                            onChange={(e) => handleAddonQuantityChange(addon.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                        </div>
                      )}
                      <span className="font-medium">
                        {formatPrice(addon.price * (selected?.quantity || 1), addon.currency)}
                        {addon.type === 'USAGE' && selected && selected.quantity > 1 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({formatPrice(addon.price, addon.currency)} each)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Address */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              3. Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={billingAddress.firstName}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={billingAddress.lastName}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={billingAddress.organization}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={billingAddress.address}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="wilaya">Wilaya</Label>
                <Input
                  id="wilaya"
                  value={billingAddress.wilaya}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, wilaya: e.target.value }))}
                  placeholder="Enter wilaya"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={billingAddress.phone}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              4. Payment Method (Optional for Testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Checkbox 
                  id="simulate-payment"
                  checked={simulatePayment}
                  onCheckedChange={setSimulatePayment}
                />
                <Label htmlFor="simulate-payment">
                  Simulate payment (for testing purposes)
                </Label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select 
                    value={paymentMethod.type} 
                    onValueChange={(value) => setPaymentMethod(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CCP_ACCOUNT">CCP Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="holderName">Cardholder Name</Label>
                  <Input
                    id="holderName"
                    value={paymentMethod.holderName}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, holderName: e.target.value }))}
                    placeholder="Enter cardholder name"
                  />
                </div>
                {paymentMethod.type === 'CREDIT_CARD' || paymentMethod.type === 'DEBIT_CARD' ? (
                  <>
                    <div>
                      <Label htmlFor="last4">Last 4 Digits</Label>
                      <Input
                        id="last4"
                        value={paymentMethod.last4}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, last4: e.target.value.slice(0, 4) }))}
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand">Card Brand</Label>
                      <Select 
                        value={paymentMethod.brand} 
                        onValueChange={(value) => setPaymentMethod(prev => ({ ...prev, brand: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiryMonth">Expiry Month</Label>
                      <Input
                        id="expiryMonth"
                        value={paymentMethod.expiryMonth}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        placeholder="12"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryYear">Expiry Year</Label>
                      <Input
                        id="expiryYear"
                        value={paymentMethod.expiryYear}
                        onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                        placeholder="2025"
                        maxLength={4}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Submit */}
      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>5. Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {plans.filter(p => p.id === selectedPlan).map(plan => (
                  <div key={plan.id} className="flex justify-between">
                    <span>{plan.displayName} ({plan.billingCycle.toLowerCase()})</span>
                    <span>{formatPrice(plan.price, plan.currency)}</span>
                  </div>
                ))}
                
                {selectedAddons.map(addon => {
                  const addonObj = addons.find(a => a.id === addon.addonId)
                  if (!addonObj) return null
                  return (
                    <div key={addon.addonId} className="flex justify-between text-sm text-gray-600">
                      <span>{addonObj.displayName} {addon.quantity > 1 ? `(${addon.quantity}x)` : ''}</span>
                      <span>{formatPrice(addonObj.price * addon.quantity, addonObj.currency)}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal(), plans.find(p => p.id === selectedPlan)?.currency || 'DZD')}</span>
                </div>
              </div>

              <Button 
                onClick={handleCreateSubscription}
                disabled={creating || !selectedPlan}
                className="w-full"
                size="lg"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Subscription...
                  </>
                ) : (
                  simulatePayment ? 'Create Subscription with Simulated Payment' : 'Create Subscription'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
