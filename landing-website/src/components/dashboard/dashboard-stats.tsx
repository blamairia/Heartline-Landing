'use client'

import { Activity, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    title: 'Active Patients',
    value: '1,234',
    change: '+12%',
    changeType: 'increase' as const,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'ECGs Analyzed',
    value: '2,847',
    change: '+8%',
    changeType: 'increase' as const,
    icon: Activity,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    title: 'Critical Alerts',
    value: '12',
    change: '-3%',
    changeType: 'decrease' as const,
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  {
    title: 'Accuracy Rate',
    value: '98.5%',
    change: '+0.2%',
    changeType: 'increase' as const,
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-gray-600">
              <span className={`font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
