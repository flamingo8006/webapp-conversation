import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAdminFromRequest, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 현재 관리자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const adminPayload = await getAdminFromRequest(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 },
      )
    }

    const admin = await adminRepository.getAdminById(adminPayload.sub)

    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ admin })
  }
  catch (error) {
    logger.apiError(request, 'Get admin me error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '정보 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// 내 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const adminPayload = await getAdminFromRequest(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { name, email, department } = body

    const oldAdmin = await adminRepository.getAdminById(adminPayload.sub)

    const admin = await adminRepository.updateAdmin(adminPayload.sub, {
      name,
      email,
      department,
      updatedBy: adminPayload.sub,
    })

    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'UPDATE',
      entityType: 'Admin',
      entityId: admin.id,
      changes: {
        before: { name: oldAdmin?.name, email: oldAdmin?.email, department: oldAdmin?.department },
        after: { name: admin.name, email: admin.email, department: admin.department },
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: '/api/admin/auth/me',
    })

    return NextResponse.json({ admin })
  }
  catch (error) {
    logger.apiError(request, 'Update admin me error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '정보 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
