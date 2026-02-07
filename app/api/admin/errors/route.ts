import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { errorLogRepository, type ErrorStatus } from '@/lib/repositories/error-log'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'

// 에러 로그 목록 조회 (슈퍼관리자 전용)
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

    // 필터 파라미터
    const filter = {
      errorType: searchParams.get('errorType') || undefined,
      source: searchParams.get('source') || undefined,
      status: searchParams.get('status') as ErrorStatus | undefined,
      appId: searchParams.get('appId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    }

    // 페이지네이션
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = parsePositiveInt(searchParams.get('limit'), 50)

    const result = await errorLogRepository.list({ filter, page, limit })

    return NextResponse.json(result)
  }
  catch (error) {
    console.error('Get errors error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '에러 로그 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
