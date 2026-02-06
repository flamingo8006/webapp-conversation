import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { usageStatsRepository } from '@/lib/repositories/usage-stats'

// 통계 개요 조회
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
    const days = Number.parseInt(searchParams.get('days') || '7')

    // super_admin은 전체, 일반 admin은 본인 앱만
    const createdBy = admin.role === 'super_admin' ? null : admin.sub

    const [overview, appRanking, realTime] = await Promise.all([
      usageStatsRepository.getOverview(days, createdBy),
      usageStatsRepository.getAppRanking(days, 10, createdBy),
      usageStatsRepository.getRealTimeStats(createdBy),
    ])

    return NextResponse.json({
      overview,
      appRanking,
      realTime,
    })
  }
  catch (error) {
    console.error('Get stats overview error:', error)
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
