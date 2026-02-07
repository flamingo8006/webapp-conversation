import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { auditLogRepository } from '@/lib/repositories/audit-log'
import { parsePositiveInt } from '@/lib/validation'

// 감사 로그 목록 조회 (슈퍼관리자 전용)
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
      actorId: searchParams.get('actorId') || undefined,
      actorType: searchParams.get('actorType') as 'admin' | 'user' | undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      success: searchParams.get('success') ? searchParams.get('success') === 'true' : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    }

    // 페이지네이션
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = parsePositiveInt(searchParams.get('limit'), 50)
    const orderBy = (searchParams.get('orderBy') || 'desc') as 'asc' | 'desc'

    const result = await auditLogRepository.list({ filter, page, limit, orderBy })

    return NextResponse.json(result)
  }
  catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: '감사 로그 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
