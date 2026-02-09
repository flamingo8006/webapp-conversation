import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth, getAdminVisibleAppIds } from '@/lib/admin-auth'
import { usageStatsRepository } from '@/lib/repositories/usage-stats'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 트렌드 데이터 조회
// super_admin: 전체 통계
// admin: 그룹 기반 필터
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request)

    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const days = parsePositiveInt(searchParams.get('days'), 30)
    const appId = searchParams.get('appId') || undefined

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    // 그룹 기반 앱 ID 필터
    const visibleAppIds = await getAdminVisibleAppIds(admin)

    const stats = await usageStatsRepository.getStatsByPeriod(startDate, endDate, appId, null, visibleAppIds)

    return NextResponse.json({
      period: { startDate, endDate, days },
      data: stats,
    })
  }
  catch (error) {
    logger.apiError(request, 'Get stats trend error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '트렌드 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
