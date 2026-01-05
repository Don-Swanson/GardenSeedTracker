'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  FileText,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react'

interface AuditLog {
  id: string
  adminId: string
  adminEmail: string
  action: string
  targetType: string
  targetId: string
  targetEmail: string | null
  reason: string | null
  details: string | null
  previousState: string | null
  newState: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

const actionLabels: Record<string, { label: string; color: string }> = {
  delete_user_data: { label: 'Delete User Data', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  delete_user_seeds: { label: 'Delete Seeds', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  delete_user_plantings: { label: 'Delete Plantings', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  delete_user_wishlist: { label: 'Delete Wishlist', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  approve_suggestion: { label: 'Approve Suggestion', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  reject_suggestion: { label: 'Reject Suggestion', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  approve_plant_request: { label: 'Approve Plant Request', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  reject_plant_request: { label: 'Reject Plant Request', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  edit_plant_request: { label: 'Edit Plant Request', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  delete_user: { label: 'Delete User', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  update_user_role: { label: 'Update Role', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  impersonate_start: { label: 'Start Impersonation', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  impersonate_end: { label: 'End Impersonation', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  update_user: { label: 'Update User', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
}

const targetTypeLabels: Record<string, string> = {
  user: 'User',
  suggestion: 'Suggestion',
  plant: 'Plant',
  seed: 'Seed',
  planting: 'Planting',
  wishlist: 'Wishlist',
  plant_request: 'Plant Request',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const limit = 25

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      })
      
      if (search) params.append('targetEmail', search)
      if (actionFilter) params.append('action', actionFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotalCount(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, startDate, endDate])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1)
      fetchLogs()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const totalPages = Math.ceil(totalCount / limit)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const getActionBadge = (action: string) => {
    const info = actionLabels[action] || { label: action, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${info.color}`}>
        {info.label}
      </span>
    )
  }

  const parseJson = (str: string | null) => {
    if (!str) return null
    try {
      return JSON.parse(str)
    } catch {
      return str
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track all admin actions for compliance and security</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by target email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Actions</option>
              {Object.entries(actionLabels).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <>
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{log.adminEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{targetTypeLabels[log.targetType] || log.targetType}: </span>
                          <span className="text-gray-900 dark:text-white">{log.targetEmail || log.targetId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-red-600 hover:text-red-700">
                          {expandedLog === log.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr key={`${log.id}-expanded`} className="bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {log.reason && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Reason</p>
                                <p className="text-gray-600 dark:text-gray-400">{log.reason}</p>
                              </div>
                            )}
                            {log.details && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Details</p>
                                <pre className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(parseJson(log.details), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.previousState && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Previous State</p>
                                <pre className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(parseJson(log.previousState), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newState && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">New State</p>
                                <pre className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(parseJson(log.newState), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.ipAddress && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">IP Address</p>
                                <p className="text-gray-600 dark:text-gray-400">{log.ipAddress}</p>
                              </div>
                            )}
                            {log.userAgent && (
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">User Agent</p>
                                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{log.userAgent}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
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
    </div>
  )
}
