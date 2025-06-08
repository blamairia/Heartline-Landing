'use client'

import { Users, CreditCard, Package, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    title: 'Active Users',
    value: '24',
    subtitle: 'of 50 licensed',
    change: '+3 this month',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },  {
    title: 'ECG Analysis Quota',
    value: '1,847',
    subtitle: 'of 5,000 monthly',
    change: '37% used',
    changeType: 'increase' as const,
    icon: Package,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    title: 'Subscription Status',
    value: 'Active',
    subtitle: 'Professional Plan',
    change: 'Renews Dec 15',
    changeType: 'increase' as const,
    icon: CreditCard,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    title: 'Days Remaining',
    value: '23',
    subtitle: 'until renewal',
    change: 'Auto-renewal ON',
    changeType: 'increase' as const,
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            {stat.subtitle && (
              <p className="text-sm text-gray-500 mb-1">
                {stat.subtitle}
              </p>
            )}
            <p className="text-xs text-gray-600">
              <span className={`font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 
                stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
