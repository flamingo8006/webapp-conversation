import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { auditLogRepository } from '@/lib/repositories/audit-log'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 감사 로그 통계 조회 (슈퍼관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const days = parsePositiveInt(searchParams.get('days'), 7)

    const [stats, actions, entityTypes] = await Promise.all([
      auditLogRepository.getStats(days),
      auditLogRepository.getActions(),
      auditLogRepository.getEntityTypes(),
    ])

    return NextResponse.json({
      stats,
      actions,
      entityTypes,
    })
  }
  catch (error) {
    logger.apiError(request, 'Get audit logs stats error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
