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
  Leaf,
  HelpCircle,
  Heart,
  Shield
} from 'lucide-react'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

interface ImpersonatedUser {
  id: string
  email: string
  name: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Sprout, requiresAuth: true },
  { href: '/seeds', label: 'Seed Inventory', icon: Package, requiresAuth: true },
  { href: '/wishlist', label: 'Wishlist', icon: Star, requiresAuth: true },
  { href: '/plants', label: 'Plant Encyclopedia', icon: Leaf, requiresAuth: true },
  { href: '/plantings', label: 'Planting Log', icon: MapPin, requiresAuth: true },
  { href: '/calendar', label: 'Planting Calendar', icon: CalendarDays, requiresAuth: true },
  { href: '/almanac', label: 'Almanac', icon: BookOpen, requiresAuth: true },
  { href: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
]

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null)

  // Check for impersonation on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check impersonation status
        const impRes = await fetch('/api/admin/impersonate/status')
        if (impRes.ok) {
          const data = await impRes.json()
          if (data.impersonating && data.user) {
            setImpersonatedUser(data.user)
          } else {
            setImpersonatedUser(null)
          }
        }
      } catch (error) {
        // Ignore errors - fall back to session data
      }
    }
    checkStatus()
  }, [pathname]) // Re-check when pathname changes

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.role === 'admin'
  
  // Use impersonated user data if available
  const displayUser = impersonatedUser || session?.user

  // Filter nav items based on auth state
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresAuth) return true
    return isAuthenticated
  })

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-garden-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-white hidden sm:block">
              Garden Seed Tracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-garden-100 dark:bg-garden-900 text-garden-700 dark:text-garden-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {session.user.image && !impersonatedUser ? (
                    <img
                      src={session.user.image}
                      alt={displayUser?.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-garden-100 dark:bg-garden-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-garden-600 dark:text-garden-400" />
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayUser?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayUser?.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      href="/support"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Request Support</span>
                    </Link>
                    <Link
                      href="/donate"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Support the Project</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-garden-100 dark:bg-garden-900 text-garden-700 dark:text-garden-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
            
            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{displayUser?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{displayUser?.email}</p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-purple-600 dark:text-purple-400 font-medium"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin Portal</span>
                    </Link>
                  )}
                  <Link
                    href="/support"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 dark:text-gray-400"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span>Request Support</span>
                  </Link>
                  <Link
                    href="/donate"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 text-pink-600 dark:text-pink-400"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Support the Project</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 dark:text-red-400"
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
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
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
