import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Billing & Invoices | Hearline Dashboard',
  description: 'Manage your billing information, payment methods, and invoices.',
}

const invoices = [
  {
    id: 'INV-2025-001',
    date: 'May 15, 2025',
    amount: '$377.00',
    status: 'Paid',
    description: 'Professional Plan + Add-ons',
    dueDate: 'May 15, 2025'
  },
  {
    id: 'INV-2025-002',
    date: 'April 15, 2025',
    amount: '$377.00',
    status: 'Paid',
    description: 'Professional Plan + Add-ons',
    dueDate: 'April 15, 2025'
  },
  {
    id: 'INV-2025-003',
    date: 'March 15, 2025',
    amount: '$299.00',
    status: 'Paid',
    description: 'Professional Plan',
    dueDate: 'March 15, 2025'
  },
  {
    id: 'INV-2025-004',
    date: 'February 15, 2025',
    amount: '$299.00',
    status: 'Paid',
    description: 'Professional Plan',
    dueDate: 'February 15, 2025'
  }
]

const paymentMethods = [
  {
    id: 1,
    type: 'Credit Card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2027,
    isDefault: true
  },
  {
    id: 2,
    type: 'Credit Card',
    last4: '5555',
    brand: 'Mastercard',
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false
  }
]

export default async function BillingPage() {
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
            Billing & Invoices
          </h1>
          <p className="text-gray-600">
            Manage your payment methods, view billing history, and download invoices.
          </p>
        </div>

        {/* Billing Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Current Balance</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">$0.00</div>
              <p className="text-xs text-gray-500 mt-1">All payments up to date</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Next Payment</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">June 15</div>
              <p className="text-xs text-gray-500 mt-1">$377.00 due</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Payment Method</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">••••4242</div>
              <p className="text-xs text-gray-500 mt-1">Visa expires 12/27</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Auto-Renewal</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">Active</div>
              <p className="text-xs text-gray-500 mt-1">Automatically renews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <Button size="sm">Add Method</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-semibold">
                        {method.brand.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {method.brand} ending in {method.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-Renewal</h3>
                    <p className="text-sm text-gray-600">Automatically renew subscription</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Billing Notifications</h3>
                    <p className="text-sm text-gray-600">Email alerts for billing events</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Usage Alerts</h3>
                    <p className="text-sm text-gray-600">Notify when approaching quota limits</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <Button className="w-full" variant="outline">
                  Update Billing Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{invoice.id}</h3>
                      <p className="text-sm text-gray-600">{invoice.description}</p>
                      <p className="text-xs text-gray-500">Date: {invoice.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{invoice.amount}</p>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing 4 of 12 invoices
                </p>
                <Button variant="outline" size="sm">
                  View All Invoices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
