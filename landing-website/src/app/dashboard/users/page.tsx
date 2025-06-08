import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Mail, Settings, MoreHorizontal, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'User Management | Hearline Dashboard',
  description: 'Manage users and team members in your Hearline subscription.',
}

const users = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@clinic.com',
    role: 'Administrator',
    status: 'Active',
    lastActive: '2 hours ago',
    ecgCount: 847,
    avatar: 'SJ'
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    email: 'michael.chen@clinic.com',
    role: 'Cardiologist',
    status: 'Active',
    lastActive: '15 minutes ago',
    ecgCount: 623,
    avatar: 'MC'
  },
  {
    id: 3,
    name: 'Dr. Emily Davis',
    email: 'emily.davis@clinic.com',
    role: 'Cardiologist',
    status: 'Active',
    lastActive: '1 day ago',
    ecgCount: 377,
    avatar: 'ED'
  },
  {
    id: 4,
    name: 'Nurse Rita Wilson',
    email: 'rita.wilson@clinic.com',
    role: 'Technician',
    status: 'Inactive',
    lastActive: '5 days ago',
    ecgCount: 0,
    avatar: 'RW'
  }
]

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage team members and their access to your Hearline subscription.
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Total Users</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">24 / 50</div>
              <p className="text-xs text-gray-500 mt-1">26 licenses available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Active Users</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">21</div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Administrators</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <p className="text-xs text-gray-500 mt-1">Full access</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">Pending Invites</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">2</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                      {user.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{user.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.ecgCount} ECGs</p>
                    <p className="text-xs text-gray-500">Last active: {user.lastActive}</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing 4 of 24 team members
                </p>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
