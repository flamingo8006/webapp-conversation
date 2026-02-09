import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth, getAdminVisibleAppIds } from '@/lib/admin-auth'
import { usageStatsRepository } from '@/lib/repositories/usage-stats'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 통계 개요 조회
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
    const days = parsePositiveInt(searchParams.get('days'), 7)

    // 그룹 기반 앱 ID 필터
    const visibleAppIds = await getAdminVisibleAppIds(admin)

    const [overview, appRanking, realTime] = await Promise.all([
      usageStatsRepository.getOverview(days, null, visibleAppIds),
      usageStatsRepository.getAppRanking(days, 10, null, visibleAppIds),
      usageStatsRepository.getRealTimeStats(null, visibleAppIds),
    ])

    // super_admin이 아니면 메시지 내용 제거 (개인정보 보호)
    if (admin.role !== 'super_admin') {
      realTime.recentMessages = []
    }

    return NextResponse.json({
      overview,
      appRanking,
      realTime,
    })
  }
  catch (error) {
    logger.apiError(request, 'Get stats overview error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
