'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Heart, 
  User, 
  Settings, 
  LogOut,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b' 
        : 'bg-transparent'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xl font-bold text-primary"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <span>Heartline</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="text-gray-700">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {session.user?.name?.charAt(0) || 'U'}
                    </div>
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-500 border-b">
                        {session.user?.email}
                      </div>
                      <Link href="/dashboard/profile">
                        <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </div>
                      </Link>
                      <Link href="/dashboard/subscription">
                        <div className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Subscription
                        </div>
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="gradient">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-primary"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 hover:text-primary transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t space-y-3">
                {session ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block">
                      <Button variant="ghost" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block">
                      <Button variant="gradient" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
