'use client'

import { Users, CreditCard, Package, Settings, UserPlus, ExternalLink, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const activities = [
  {
    id: 1,
    type: 'user_access',
    title: 'Hearline App Accessed',
    description: 'Dr. Smith analyzed 3 ECGs in the main platform',
    time: '15 minutes ago',
    icon: ExternalLink,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 2,
    type: 'user_added',
    title: 'New User Invited',
    description: 'Dr. Johnson was added to your Professional plan',
    time: '2 hours ago',
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    id: 3,
    type: 'billing',
    title: 'Invoice Generated',
    description: 'Monthly invoice for $299 is now available',
    time: '1 day ago',
    icon: CreditCard,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 4,
    type: 'quota_warning',
    title: 'Quota Alert',
    description: 'You have used 80% of your monthly ECG analysis quota',
    time: '2 days ago',
    icon: Package,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 5,
    type: 'settings_update',
    title: 'Settings Updated',
    description: 'Auto-renewal has been enabled for your subscription',
    time: '3 hours ago',
    icon: Activity,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  }
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View all activity →
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
