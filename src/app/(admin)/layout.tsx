'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  Shield, 
  Users, 
  Leaf, 
  FileEdit, 
  LayoutDashboard, 
  ArrowLeft,
  UserCog,
  AlertTriangle,
  Loader2,
  ClipboardList,
  MessageSquarePlus,
  Bell
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/plants', icon: Leaf, label: 'Plants' },
  { href: '/admin/submissions', icon: FileEdit, label: 'Submissions' },
  { href: '/admin/suggestions', icon: MessageSquarePlus, label: 'Suggestions' },
  { href: '/admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
  { href: '/admin/notification-settings', icon: Bell, label: 'Notifications' },
  { href: '/admin/impersonate', icon: UserCog, label: 'Impersonate' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setIsAuthorized(true)
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-garden-600" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have permission to access admin pages.</p>
          <Link href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-red-900 dark:bg-red-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-red-200 text-sm">Garden Seed Tracker</p>
              </div>
            </div>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-3 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 min-h-[calc(100vh-76px)] bg-white dark:bg-gray-800 shadow-md">
          <nav className="p-4 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Logged in as:</p>
              <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
