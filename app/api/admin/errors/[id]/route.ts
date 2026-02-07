import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { errorLogRepository, type ErrorStatus } from '@/lib/repositories/error-log'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 에러 상세 조회 (슈퍼관리자 전용)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const error = await errorLogRepository.getById(id)

    if (!error) {
      return NextResponse.json(
        { error: '에러 로그를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ error })
  }
  catch (error) {
    logger.apiError(request, 'Get error detail error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '에러 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// 에러 상태 변경 (슈퍼관리자 전용)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, resolution } = body as { status: ErrorStatus, resolution?: string }

    const existingError = await errorLogRepository.getById(id)
    if (!existingError) {
      return NextResponse.json(
        { error: '에러 로그를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const updatedError = await errorLogRepository.updateStatus(
      id,
      status,
      admin.sub,
      resolution,
    )

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(admin),
      action: 'UPDATE_ERROR_STATUS',
      entityType: 'ErrorLog',
      entityId: id,
      changes: {
        before: { status: existingError.status },
        after: { status, resolution },
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: `/api/admin/errors/${id}`,
    })

    return NextResponse.json({ error: updatedError })
  }
  catch (error) {
    logger.apiError(request, 'Update error status error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '상태 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
