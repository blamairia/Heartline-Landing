'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showBillingForm, setShowBillingForm] = useState(false)
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

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      displayName: 'Basic Plan',
      description: 'Perfect for small practices getting started',
      price: 9900,
      currency: 'DZD',
      billing: 'month',
      billingCycle: 'monthly',
      features: [
        'Up to 100 ECG analyses per month',
        'Basic patient management',
        'Email support',
        'Mobile app access',
        'Basic reporting'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      displayName: 'Professional Plan',
      description: 'Ideal for growing medical practices',
      price: 29900,
      currency: 'DZD',
      billing: 'month',
      billingCycle: 'monthly',
      features: [
        'Up to 500 ECG analyses per month',
        'Advanced patient management',
        'Priority support',
        'API access',
        'Custom reports',
        'Multi-user access'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      displayName: 'Enterprise Plan',
      description: 'Complete solution for large organizations',
      price: 99900,
      currency: 'DZD',
      billing: 'month',
      billingCycle: 'monthly',
      features: [
        'Unlimited ECG analyses',
        'Full patient management suite',
        '24/7 dedicated support',
        'Custom integrations',
        'White-label options',
        'Advanced analytics'
      ]
    }
  ]

  const wilayaOptions = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
    "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
    "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
    "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
    "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
    "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
    "Ghardaïa", "Relizane"
  ]

  const handlePlanSelect = (plan: any) => {
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
    setShowBillingForm(true)
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
        
        // Show success message with invoice info
        const invoiceInfo = `
Subscription Created Successfully! 🎉

Plan: ${selectedPlan.displayName}
Amount: ${(selectedPlan.price / 100).toFixed(0)} DZD/${selectedPlan.billing}
Invoice ID: ${data.invoiceId}
Subscription Status: Active

Your subscription has been activated and an invoice has been generated.
You will be redirected to your dashboard.
        `
        
        alert(invoiceInfo)
        setShowBillingForm(false)
        router.push('/dashboard?tab=subscription')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to create subscription'}`)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to create subscription. Please try again.')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return (amount / 100).toFixed(0)
  }
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
          </div>
        </div>
      </div>
    </div>
  )
}
