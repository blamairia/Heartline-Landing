'use client'

import { Activity, FileText, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const activities = [
  {
    id: 1,
    type: 'ecg_analysis',
    title: 'ECG Analysis Completed',
    description: 'Normal sinus rhythm detected for Patient #1234',
    time: '2 minutes ago',
    icon: Activity,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  },
  {
    id: 2,
    type: 'alert',
    title: 'Critical Alert',
    description: 'Atrial fibrillation detected in Patient #5678',
    time: '15 minutes ago',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  {
    id: 3,
    type: 'report',
    title: 'Report Generated',
    description: 'Weekly cardiac summary for Dr. Johnson',
    time: '1 hour ago',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 4,
    type: 'patient',
    title: 'New Patient Registered',
    description: 'John Doe added to monitoring system',
    time: '2 hours ago',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50'
  },
  {
    id: 5,
    type: 'ecg_analysis',
    title: 'ECG Analysis Completed',
    description: 'ST elevation detected - immediate attention required',
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
