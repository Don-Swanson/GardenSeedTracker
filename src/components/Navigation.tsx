'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  Sprout, 
  Package, 
  CalendarDays, 
  MapPin, 
  Star, 
  BookOpen, 
  Settings,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Crown
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Sprout, requiresAuth: false },
  { href: '/seeds', label: 'Seed Inventory', icon: Package, requiresAuth: true },
  { href: '/plantings', label: 'Planting Log', icon: MapPin, requiresAuth: true, requiresPaid: true },
  { href: '/calendar', label: 'Planting Calendar', icon: CalendarDays, requiresAuth: true, requiresPaid: true },
  { href: '/wishlist', label: 'Wishlist', icon: Star, requiresAuth: true },
  { href: '/almanac', label: 'Almanac', icon: BookOpen, requiresAuth: true, requiresPaid: true },
  { href: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
]

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const isPaid = session?.user?.isPaid

  // Filter nav items based on auth state
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresAuth) return true
    return isAuthenticated
  })

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-garden-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800 hidden sm:block">
              Garden Seed Tracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const showPaidBadge = item.requiresPaid && !isPaid
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-garden-100 text-garden-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {showPaidBadge && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-garden-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-garden-600" />
                    </div>
                  )}
                  {isPaid && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          <Crown className="w-3 h-3" />
                          Pro
                        </span>
                      ) : (
                        <Link
                          href="/upgrade"
                          onClick={() => setUserMenuOpen(false)}
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-garden-100 text-garden-700 text-xs rounded-full hover:bg-garden-200"
                        >
                          Upgrade to Pro
                        </Link>
                      )}
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-garden-600 text-white text-sm font-medium rounded-lg hover:bg-garden-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const showPaidBadge = item.requiresPaid && !isPaid
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-garden-100 text-garden-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {showPaidBadge && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </Link>
              )
            })}
            
            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                  </div>
                  {!isPaid && (
                    <Link
                      href="/upgrade"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-garden-600 font-medium"
                    >
                      <Crown className="w-5 h-5" />
                      <span>Upgrade to Pro</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign in</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-garden-600 text-white rounded-lg"
                  >
                    <span>Sign up free</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
