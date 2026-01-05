'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  MoreVertical, 
  Shield, 
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Mail,
  Play,
  Pause,
  Plus,
  Edit,
  X
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  username: string | null
  role: string
  createdAt: string
  seedCount: number
  plantingCount: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActions, setShowActions] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // For edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '' })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        filter,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, filter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showActions && !(e.target as Element).closest('.actions-dropdown')) {
        setShowActions(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showActions])

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email
    })
    setShowActions(null)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateDetails',
          name: editForm.name || null,
          username: editForm.username || null,
          email: editForm.email
        })
      })
      
      if (res.ok) {
        fetchUsers()
        setEditingUser(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('Failed to update user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAction = async (action: string, userId: string, extra?: any) => {
    setActionLoading(true)
    try {
      // Use DELETE method for deleteData action, PATCH for everything else
      const method = action === 'deleteData' ? 'DELETE' : 'PATCH'
      const res = await fetch(`/api/admin/users/${userId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'PATCH' ? { body: JSON.stringify({ action, ...extra }) } : {})
      })
      
      if (res.ok) {
        fetchUsers()
        setShowActions(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Action failed')
      }
    } catch (err) {
      console.error('Action failed:', err)
      alert('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleImpersonate = async (user: User) => {
    if (!confirm(`Start impersonating ${user.email}?\n\nYou will see the app exactly as they do. All actions will be logged.`)) {
      return
    }
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to start impersonation')
      }
    } catch (err) {
      console.error('Failed to start impersonation:', err)
      alert('Failed to start impersonation')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (user: User) => {
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-fit">Free</span>
  }

  const selectedUser = users.find(u => u.id === showActions)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'admin'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seeds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name || '—'}</p>
                        {user.username && (
                          <p className="text-sm text-gray-400 dark:text-gray-500">@{user.username}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(user)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-1 w-fit">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.seedCount} seeds
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right actions-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowActions(showActions === user.id ? null : user.id)
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions Dropdown - Fixed position modal */}
      {showActions && selectedUser && (
        <div className="fixed inset-0 z-40" onClick={() => setShowActions(null)}>
          <div 
            className="fixed top-1/4 right-8 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            ref={dropdownRef}
          >
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{selectedUser.email}</p>
              </div>
              
              {/* Edit User Details */}
              <button
                onClick={() => handleEditUser(selectedUser)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit Details
              </button>
              
              {/* Impersonate */}
              {selectedUser.role !== 'admin' && (
                <button
                  onClick={() => handleImpersonate(selectedUser)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <UserCog className="w-4 h-4" /> Impersonate
                </button>
              )}
              
              {/* Send Email */}
              <button
                onClick={() => window.open(`mailto:${selectedUser.email}`, '_blank')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> Send Email
              </button>
              
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              
              {/* Danger Zone */}
              <button
                onClick={() => {
                  if (confirm(`Delete all data for ${selectedUser.email}? This cannot be undone.`)) {
                    handleAction('deleteData', selectedUser.id)
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" /> Delete User Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="@username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
