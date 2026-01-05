import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint for Docker/Kubernetes
 * GET /api/health
 */
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
    },
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = 'healthy'
  } catch (error) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
