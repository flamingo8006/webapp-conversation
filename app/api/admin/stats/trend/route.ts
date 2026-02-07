import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { usageStatsRepository } from '@/lib/repositories/usage-stats'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'

// 트렌드 데이터 조회
// super_admin: 전체 통계
// admin: 본인이 생성한 챗봇의 통계만
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

    // super_admin은 전체, 일반 admin은 본인 앱만
    const createdBy = admin.role === 'super_admin' ? null : admin.sub

    const stats = await usageStatsRepository.getStatsByPeriod(startDate, endDate, appId, createdBy)

    return NextResponse.json({
      period: { startDate, endDate, days },
      data: stats,
    })
  }
  catch (error) {
    console.error('Get stats trend error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '트렌드 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
