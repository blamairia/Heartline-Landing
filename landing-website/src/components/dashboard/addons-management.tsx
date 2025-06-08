'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, CheckCircle, Clock, BarChart3, Shield, Zap, Users, Loader2, AlertCircle } from 'lucide-react'
import { AddonsResponse } from '@/types/api'

const addonIcons: Record<string, any> = {
  'Advanced Analytics': BarChart3,
  'Priority Support': Shield,
  'AI Enhancement Pack': Zap,
  'Team Collaboration': Users,
  'Extended Storage': Package,
  'Custom Integrations': Package,
}

export function AddonsManagement() {
  const [addonsData, setAddonsData] = useState<AddonsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch('/api/dashboard/addons')
        if (!response.ok) {
          throw new Error('Failed to fetch addons data')
        }
        const data: AddonsResponse = await response.json()
        setAddonsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load addons')
        console.error('Error fetching addons:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddons()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !addonsData) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error || 'Failed to load addons'}</span>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add-ons & Extensions
        </h1>
        <p className="text-gray-600">
          Enhance your Hearline experience with powerful add-ons and integrations.
        </p>
      </div>      {/* Active Add-ons */}
      {addonsData.activeAddons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Add-ons</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {addonsData.activeAddons.map((addon) => {
              const IconComponent = addonIcons[addon.name] || Package
              return (
                <Card key={addon.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{addon.name}</CardTitle>
                          <p className="text-sm text-gray-600">{addon.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {addon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Status: {addon.isActive ? 'Active' : 'Inactive'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Added: {addon.addedDate ? formatDate(addon.addedDate.toString()) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(addon.price, addon.currency)}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Add-ons */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Add-ons</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addonsData.availableAddons.map((addon) => {
            const IconComponent = addonIcons[addon.name] || Package
            return (
              <Card key={addon.id} className={`relative ${addon.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {addon.popular && (
                  <div className="absolute -top-2 left-4">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <p className="text-sm text-gray-600">{addon.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(addon.price, addon.currency)}
                    </div>
                    
                    <div className="space-y-2">
                      {addon.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button className="w-full" variant={addon.popular ? "default" : "outline"}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Usage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add-on Usage Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {addonsData.activeAddons.length}
              </div>
              <p className="text-sm text-gray-600">Active Add-ons</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(
                  addonsData.activeAddons.reduce((total, addon) => total + addon.price, 0),
                  addonsData.activeAddons[0]?.currency || 'USD'
                )}
              </div>
              <p className="text-sm text-gray-600">Monthly Add-on Cost</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {addonsData.availableAddons.length}
              </div>
              <p className="text-sm text-gray-600">Available Add-ons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
