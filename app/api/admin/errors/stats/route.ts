import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { errorLogRepository } from '@/lib/repositories/error-log'
import { parsePositiveInt } from '@/lib/validation'

// 에러 통계 조회 (슈퍼관리자 전용)
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

    const [stats, errorTypes] = await Promise.all([
      errorLogRepository.getStats(days),
      errorLogRepository.getErrorTypes(),
    ])

    return NextResponse.json({
      stats,
      errorTypes,
    })
  }
  catch (error) {
    console.error('Get errors stats error:', error)
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
