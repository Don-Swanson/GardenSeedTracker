import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Leaf, 
  FileEdit,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface RecentUser {
  id: string
  email: string
  name: string | null
  createdAt: Date
  role: string
}

interface RecentSubmission {
  id: string
  plantName: string
  status: string
  createdAt: Date
  user: { email: string } | null
}

async function getAdminStats() {
  const [
    totalUsers,
    totalPlants,
    pendingSubmissions,
    recentUsers,
    recentSubmissions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.plantingGuide.count(),
    prisma.plantRequest.count({ where: { status: 'pending' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true, role: true }
    }),
    prisma.plantRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { email: true } } }
    })
  ])

  return {
    totalUsers,
    totalPlants,
    pendingSubmissions,
    recentUsers: recentUsers as RecentUser[],
    recentSubmissions: recentSubmissions as RecentSubmission[]
  }
}

export default async function AdminDashboard() {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of Garden Seed Tracker</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-80" />
          </div>
          <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block">
            View all users →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plants in Encyclopedia</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPlants}</p>
            </div>
            <Leaf className="w-10 h-10 text-garden-500 opacity-80" />
          </div>
          <Link href="/admin/plants" className="text-sm text-garden-600 dark:text-garden-400 hover:underline mt-2 block">
            Manage plants →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Submissions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingSubmissions}</p>
            </div>
            <FileEdit className="w-10 h-10 text-amber-500 opacity-80" />
          </div>
          <Link href="/admin/submissions" className="text-sm text-amber-600 dark:text-amber-400 hover:underline mt-2 block">
            Review submissions →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Users
          </h2>
          <div className="space-y-3">
            {stats.recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.name || user.email}
                    {user.role === 'admin' && (
                      <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 block">
            View all users →
          </Link>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pending Submissions
          </h2>
          {stats.recentSubmissions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No pending submissions
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentSubmissions.map(submission => (
                <div key={submission.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{submission.plantName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {submission.user?.email || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/submissions" className="text-sm text-amber-600 dark:text-amber-400 hover:underline mt-4 block">
            Review all submissions →
          </Link>
        </div>
      </div>
    </div>
  )
}
