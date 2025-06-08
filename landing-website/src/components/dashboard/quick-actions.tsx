'use client'

import { Plus, FileText, Users, Activity, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const actions = [
  {
    title: 'Analyze ECG',
    description: 'Upload and analyze a new ECG',
    icon: Activity,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    href: '/dashboard/analyze'
  },
  {
    title: 'Add Patient',
    description: 'Register a new patient',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    href: '/dashboard/patients/new'
  },
  {
    title: 'Generate Report',
    description: 'Create clinical report',
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    href: '/dashboard/reports/new'
  },
  {
    title: 'AI Consultation',
    description: 'Get AI-powered insights',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    href: '/dashboard/ai-consultation'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              asChild
            >
              <a href={action.href}>
                <div className={`p-2 rounded-lg ${action.bgColor} mr-3 flex-shrink-0`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {action.description}
                  </div>
                </div>
              </a>
            </Button>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            More Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
