'use client'

import Link from 'next/link'
import { Crown, ArrowRight, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SubscriptionCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-gray-900">
            Professional Plan
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              $599<span className="text-sm font-normal text-gray-600">/month</span>
            </div>
            <p className="text-sm text-gray-600">
              Current billing cycle
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">500 ECG analyses remaining</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">25 patients monitored</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-700">Predictive analytics enabled</span>
            </div>
          </div>          <div className="pt-4 space-y-2">
            <Button className="w-full" size="sm" asChild>
              <Link href="/dashboard/subscription/upgrade">
                Upgrade Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" size="sm" asChild>
              <Link href="/dashboard/subscription">
                Manage Subscription
              </Link>
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Next billing: June 15, 2025
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
