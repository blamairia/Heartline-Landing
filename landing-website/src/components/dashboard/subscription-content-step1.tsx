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

export function SubscriptionContent() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/subscription')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }
      
      const data = await response.json()
      setSubscriptionData(data)
    } catch (error: any) {
      console.error('Error fetching subscription data:', error)
      setError(error.message || 'Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return `${(amount / 100).toLocaleString()} ${currency}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Mock handlers for Step 1
  const handleCancelSubscription = () => {
    alert('🚧 Cancel subscription feature - Coming in next step!')
  }

  const handleUpgradeSubscription = () => {
    alert('🚧 Upgrade subscription feature - Coming in next step!')
  }

  const handleManageAddons = () => {
    alert('🚧 Manage add-ons feature - Coming in next step!')
  }

  const handleUpdatePayment = () => {
    alert('🚧 Update payment method feature - Coming in next step!')
  }

  const handleDownloadInvoice = () => {
    alert('🚧 Download invoice feature - Coming in next step!')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '1.125rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            marginBottom: '1rem', 
            fontSize: '2rem'
          }}>⏳</div>
          Loading subscription data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        margin: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Error Loading Subscription</h3>
        <p style={{ color: '#7f1d1d' }}>{error}</p>
        <button 
          onClick={fetchSubscriptionData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Subscription Management
        </h1>
        <p style={{ color: '#6b7280' }}>
          Manage your Hearline subscription, billing, and add-ons
        </p>
      </div>

      {!subscriptionData?.hasActiveSubscription ? (
        // No Active Subscription
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '0.75rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#92400e' }}>
            No Active Subscription
          </h2>
          <p style={{ color: '#78350f', marginBottom: '2rem' }}>
            You don't have an active subscription. Choose a plan to get started with Hearline's ECG analysis features.
          </p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            View Available Plans
          </Link>
        </div>
      ) : (
        // Active Subscription
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Main Subscription Card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {subscriptionData.subscription?.plan.displayName}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: subscriptionData.subscription?.status === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                    color: subscriptionData.subscription?.status === 'ACTIVE' ? '#065f46' : '#92400e',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {subscriptionData.subscription?.status}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Since {formatDate(subscriptionData.subscription?.startDate || '')}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                  {formatCurrency(subscriptionData.totalMonthlyCost || subscriptionData.subscription?.plan.price || 0, subscriptionData.subscription?.plan.currency)}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  per {subscriptionData.subscription?.plan.billingCycle === 'MONTHLY' ? 'month' : 'year'}
                </div>
              </div>
            </div>            {/* Plan Features */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                🎯 Plan Features
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
                {(() => {
                  try {
                    const features = subscriptionData.subscription?.plan.features;
                    if (!features) return null;
                    
                    // Handle different possible formats
                    let featuresList = [];
                    if (typeof features === 'string') {
                      const parsed = JSON.parse(features);
                      featuresList = parsed.features || parsed || [];
                    } else if (typeof features === 'object') {
                      featuresList = features.features || features || [];
                    }
                    
                    return featuresList.map((feature: string, index: number) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span style={{ fontSize: '0.875rem' }}>{feature}</span>
                      </div>
                    ));
                  } catch (error) {
                    console.error('Error parsing features:', error);
                    return (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Features information unavailable
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Add-ons */}
            {subscriptionData.subscription?.addons && subscriptionData.subscription.addons.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                  ⚡ Active Add-ons
                </h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {subscriptionData.subscription.addons
                    .filter(addon => addon.isActive)
                    .map((addon) => (
                      <div 
                        key={addon.id} 
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500' }}>{addon.addon.displayName}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Quantity: {addon.quantity}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                          {formatCurrency(addon.addon.price * addon.quantity, subscriptionData.subscription?.plan.currency)}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Billing Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                💳 Billing Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Next Payment</div>
                  <div style={{ fontWeight: '500' }}>{formatDate(subscriptionData.subscription?.nextPaymentDate || '')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Subscription End</div>
                  <div style={{ fontWeight: '500' }}>{formatDate(subscriptionData.subscription?.endDate || '')}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={handleUpgradeSubscription}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                🚀 Upgrade Plan
              </button>
              
              <button
                onClick={handleManageAddons}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                ⚡ Manage Add-ons
              </button>
              
              <button
                onClick={handleUpdatePayment}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                💳 Update Payment
              </button>
              
              <button
                onClick={handleDownloadInvoice}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
              >
                📄 Download Invoice
              </button>
              
              <button
                onClick={handleCancelSubscription}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                ❌ Cancel Subscription
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              🛠️ Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <Link
                href="/pricing"
                style={{
                  display: 'block',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💎</div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Compare Plans</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>See all available subscription plans</div>
              </Link>
              
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => alert('🚧 Usage analytics - Coming in next step!')}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Usage Analytics</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>View your monthly usage statistics</div>
              </div>
              
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => alert('🚧 Billing history - Coming in next step!')}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧾</div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Billing History</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Download invoices and payment history</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
