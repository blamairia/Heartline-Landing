import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, CreditCard, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Subscription | Hearline Dashboard',
  description: 'Manage your Hearline subscription and billing.',
}

export default async function SubscriptionPage() {
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
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your plan, billing, and usage details.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Professional Plan</h3>
                    <p className="text-gray-600">Advanced features for growing practices</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">$599</div>
                    <div className="text-sm text-gray-600">per month</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Plan Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">1000 ECG analyses/month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">Unlimited patients</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">AI predictive analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">Priority support</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Usage This Month</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>ECG Analyses</span>
                          <span>742 / 1000</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Patients Monitored</span>
                          <span>156</span>
                        </div>
                        <Badge variant="default" className="text-xs">Unlimited</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button>Upgrade Plan</Button>
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  Billing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">June 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">$599.00</p>
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">May 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">$599.00</p>
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">April 2024</p>
                        <p className="text-sm text-gray-600">Professional Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">$599.00</p>
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Billing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Next Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">July 8, 2024</div>
                  <p className="text-sm text-gray-600 mb-4">$599.00 will be charged</p>
                  <Button size="sm" variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions about your subscription? Our support team is here to help.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
