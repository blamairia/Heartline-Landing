import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, CheckCircle, Clock, BarChart3, Shield, Zap, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Add-ons | Hearline Dashboard',
  description: 'Manage add-ons and additional features for your Hearline subscription.',
}

const activeAddons = [
  {
    id: 1,
    name: 'Advanced Analytics',
    description: 'Enhanced reporting and trend analysis',
    price: '$49/month',
    status: 'Active',
    usage: '78% utilized',
    icon: BarChart3,
    nextBilling: 'June 15, 2025'
  },
  {
    id: 2,
    name: 'Priority Support',
    description: '24/7 premium technical support',
    price: '$29/month',
    status: 'Active',
    usage: 'Available',
    icon: Shield,
    nextBilling: 'June 15, 2025'
  }
]

const availableAddons = [
  {
    id: 3,
    name: 'AI Enhancement Pack',
    description: 'Advanced AI algorithms for better accuracy',
    price: '$99/month',
    features: ['10% better accuracy', 'Predictive analysis', 'Risk scoring'],
    icon: Zap,
    popular: true
  },
  {
    id: 4,
    name: 'Team Collaboration',
    description: 'Advanced collaboration tools for large teams',
    price: '$39/month',
    features: ['Team chat', 'Case discussions', 'Shared annotations'],
    icon: Users,
    popular: false
  },
  {
    id: 5,
    name: 'Extended Storage',
    description: 'Additional storage for ECG files and reports',
    price: '$19/month',
    features: ['100GB additional storage', 'Extended retention', 'Backup & restore'],
    icon: Package,
    popular: false
  },
  {
    id: 6,
    name: 'Custom Integrations',
    description: 'Connect with your existing hospital systems',
    price: '$149/month',
    features: ['EPIC integration', 'Cerner compatibility', 'Custom APIs'],
    icon: Package,
    popular: false
  }
]

export default async function AddonsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add-ons & Extensions
          </h1>
          <p className="text-gray-600">
            Enhance your Hearline experience with powerful add-ons and integrations.
          </p>
        </div>

        {/* Active Add-ons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Add-ons</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {activeAddons.map((addon) => (
              <Card key={addon.id} className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <addon.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{addon.name}</CardTitle>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {addon.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Usage: {addon.usage}</p>
                      <p className="text-xs text-gray-500">Next billing: {addon.nextBilling}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{addon.price}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Available Add-ons */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Add-ons</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAddons.map((addon) => (
              <Card key={addon.id} className={`relative ${addon.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {addon.popular && (
                  <div className="absolute -top-2 left-4">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <addon.icon className="w-5 h-5 text-gray-600" />
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
                      {addon.price}
                    </div>
                    
                    <div className="space-y-2">
                      {addon.features.map((feature, index) => (
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
            ))}
          </div>
        </div>

        {/* Usage Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add-on Usage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">2</div>
                <p className="text-sm text-gray-600">Active Add-ons</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">$78</div>
                <p className="text-sm text-gray-600">Monthly Add-on Cost</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">4</div>
                <p className="text-sm text-gray-600">Available Add-ons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
