'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Bell, Settings, User, LogOut, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Heartline</span>
          </Link>          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="text-gray-900 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/subscription" className="text-gray-600 hover:text-gray-900">
              Subscription
            </Link>
            <Link href="/dashboard/users" className="text-gray-600 hover:text-gray-900">
              Users
            </Link>
            <Link href="/dashboard/addons" className="text-gray-600 hover:text-gray-900">
              Add-ons
            </Link>
            <Link href="/dashboard/billing" className="text-gray-600 hover:text-gray-900">
              Billing
            </Link>
          </nav>{/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" title="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/settings" title="Settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/profile" title="Profile">
                <User className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
