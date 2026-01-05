/**
 * Admin Audit Logging
 * 
 * Records all admin actions for compliance and security tracking
 */

import { prisma } from './prisma'

export type AuditAction = 
  | 'delete_user_data'
  | 'delete_user_seeds'
  | 'delete_user_plantings'
  | 'delete_user_wishlist'
  | 'approve_suggestion'
  | 'reject_suggestion'
  | 'approve_plant_request'
  | 'reject_plant_request'
  | 'edit_plant_request'
  | 'delete_user'
  | 'update_user_role'
  | 'update_user_details'
  | 'impersonate_start'
  | 'impersonate_end'
  // API-based plant management actions
  | 'create_plant_via_api'
  | 'update_plant_via_api'
  | 'patch_plant_via_api'
  | 'delete_plant_via_api'
  | 'bulk_upsert_plants_via_api'
  | 'bulk_delete_plants_via_api'

export type AuditTargetType = 
  | 'user'
  | 'suggestion'
  | 'plant'
  | 'seed'
  | 'planting'
  | 'wishlist'
  | 'plant_request'

export interface AuditLogEntry {
  adminId: string
  adminEmail: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetEmail?: string | null
  reason?: string | null
  details?: Record<string, any> | null
  previousState?: Record<string, any> | null
  newState?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Create an audit log entry for an admin action
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const log = await prisma.adminAuditLog.create({
    data: {
      adminId: entry.adminId,
      adminEmail: entry.adminEmail,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetEmail: entry.targetEmail || null,
      reason: entry.reason || null,
      details: entry.details ? JSON.stringify(entry.details) : null,
      previousState: entry.previousState ? JSON.stringify(entry.previousState) : null,
      newState: entry.newState ? JSON.stringify(entry.newState) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    },
  })
  
  return log.id
}

/**
 * Helper to extract request metadata for audit logging
 */
export function getRequestMetadata(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || null
  const userAgent = request.headers.get('user-agent') || null
  
  return { ipAddress, userAgent }
}

/**
 * Query audit logs with filtering
 */
export async function queryAuditLogs(options: {
  adminId?: string
  targetId?: string
  targetEmail?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}
  
  if (options.adminId) where.adminId = options.adminId
  if (options.targetId) where.targetId = options.targetId
  if (options.targetEmail) where.targetEmail = options.targetEmail
  if (options.action) where.action = options.action
  
  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }
  
  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.adminAuditLog.count({ where }),
  ])
  
  return {
    logs: logs.map((log: { 
      details: string | null
      previousState: string | null
      newState: string | null
      [key: string]: unknown
    }) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      previousState: log.previousState ? JSON.parse(log.previousState) : null,
      newState: log.newState ? JSON.parse(log.newState) : null,
    })),
    total,
    hasMore: (options.offset || 0) + logs.length < total,
  }
}
