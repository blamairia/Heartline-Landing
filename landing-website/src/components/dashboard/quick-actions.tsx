'use client'

import { Plus, CreditCard, Users, Package, Settings, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const actions = [
  {
    title: 'Access Hearline App',
    description: 'Open the cardiac analysis platform',
    icon: ExternalLink,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    href: 'https://app.hearline.ai',
    external: true
  },
  {
    title: 'Invite Users',
    description: 'Add team members to your plan',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    href: '/dashboard/users/invite'
  },
  {
    title: 'Upgrade Plan',
    description: 'Get more features and capacity',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    href: '/dashboard/subscription/upgrade'
  },
  {
    title: 'Billing Settings',
    description: 'Manage payment and invoices',
    icon: CreditCard,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    href: '/dashboard/billing'
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
