'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SubscriptionData {
  subscription: {
    id: string
    status: string
    startDate: string
    endDate: string
    nextPaymentDate: string
    plan: {
      id: string
      name: string
      displayName: string
      price: number
      currency: string
      billingCycle: string
      features: any
    }
    addons: Array<{
      id: string
      addon: {
        id: string
        name: string
        displayName: string
        price: number
      }
      quantity: number
      isActive: boolean
    }>
  } | null
  hasActiveSubscription: boolean
  totalMonthlyCost?: number
}
      name: string
      displayName: string
      price: number
      quantity: number
      type: string
    }>
    billing: {
      startDate: string
      endDate: string
      nextPaymentDate: string
      lastPaymentDate: string | null
      totalMonthlyCost: number
      currency: string
      autoRenew: boolean
    }
    trial: {
      isTrialUsed: boolean
      trialStartDate: string | null
      trialEndDate: string | null
    }
    usage: {
      currentPeriodStart: string
      currentPeriodEnd: string
      usageData: any
    }
  } | null
  hasActiveSubscription: boolean
}

export function SubscriptionContent() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/dashboard/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data.data || null)
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionData?.subscription) return
    
    setCancelling(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData.subscription.id,
          reason: cancelReason
        })
      })

      if (response.ok) {
        alert('✅ Subscription cancelled successfully')
        setShowCancelDialog(false)
        fetchSubscriptionData()
      } else {
        const error = await response.json()
        alert(`❌ Failed to cancel subscription: ${error.message}`)
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('❌ Failed to cancel subscription. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <DashboardHeader />
        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading subscription data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <DashboardHeader />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            Subscription Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Manage your Hearline subscription, billing, and account settings
          </p>
        </div>

        {!subscriptionData?.hasActiveSubscription ? (
          // No Active Subscription
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👑</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              No Active Subscription
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              You don't have an active subscription yet. Choose a plan that fits your practice needs and start analyzing ECGs with advanced AI assistance.
            </p>
            <Link 
              href="/pricing"
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              🚀 View Available Plans
            </Link>
          </div>
        ) : (
          // Active Subscription
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Current Plan Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                      {subscriptionData?.subscription?.plan?.displayName}
                    </h2>
                    <div style={{
                      backgroundColor: subscriptionData?.subscription?.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                      color: subscriptionData?.subscription?.status === 'ACTIVE' ? '#166534' : '#92400e',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {subscriptionData?.subscription?.status}
                    </div>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                    {formatCurrency(subscriptionData?.subscription?.plan?.price || 0)} per {subscriptionData?.subscription?.plan?.billingCycle?.toLowerCase()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Next Payment</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                    {subscriptionData?.subscription?.billing?.nextPaymentDate 
                      ? formatDate(subscriptionData.subscription.billing.nextPaymentDate)
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Plan Features */}
              {subscriptionData?.subscription?.plan?.features && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: '#1f2937' }}>
                    Plan Features
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
                    {JSON.parse(subscriptionData.subscription.plan.features).features?.map((feature: string, index: number) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link 
                  href="/pricing"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  📈 Upgrade Plan
                </Link>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Cancel Subscription
                </button>
              </div>
            </div>

            {/* Billing Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                💳 Billing Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Billing Cycle</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                    {subscriptionData?.subscription?.plan?.billingCycle}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Auto Renewal</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500', color: subscriptionData?.subscription?.billing?.autoRenew ? '#10b981' : '#ef4444' }}>
                    {subscriptionData?.subscription?.billing?.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Last Payment</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                    {subscriptionData?.subscription?.billing?.lastPaymentDate 
                      ? formatDate(subscriptionData.subscription.billing.lastPaymentDate)
                      : 'No payments yet'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Add-ons (if any) */}
            {subscriptionData?.subscription?.addons && subscriptionData.subscription.addons.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                  🔧 Add-ons
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {subscriptionData.subscription.addons.map((addon) => (
                    <div key={addon.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{addon.displayName}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quantity: {addon.quantity}</p>
                      </div>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                        {formatCurrency(addon.price * addon.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancel Subscription Dialog */}
        {showCancelDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                Cancel Subscription
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Are you sure you want to cancel your subscription? This action cannot be undone and you'll lose access to your plan features.
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Help us improve by sharing why you're cancelling..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  disabled={cancelling}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                    opacity: cancelling ? 0.7 : 1
                  }}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
