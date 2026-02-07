import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { usageStatsRepository } from '@/lib/repositories/usage-stats'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 통계 재계산 (슈퍼관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { date } = body

    const targetDate = date ? new Date(date) : new Date()

    await usageStatsRepository.recalculateStats(targetDate)

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(admin),
      action: 'RECALCULATE_STATS',
      entityType: 'UsageStats',
      entityId: targetDate.toISOString().split('T')[0],
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: '/api/admin/stats/recalculate',
    })

    return NextResponse.json({
      success: true,
      message: `${targetDate.toISOString().split('T')[0]} 통계가 재계산되었습니다.`,
    })
  }
  catch (error) {
    logger.apiError(request, 'Recalculate stats error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '통계 재계산 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
