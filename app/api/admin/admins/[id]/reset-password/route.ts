import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { auditLogger } from '@/lib/audit-logger'
import { validatePassword, getPasswordPolicyDescription } from '@/lib/password-policy'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 비밀번호 초기화 (슈퍼관리자 전용)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const adminPayload = await requireSuperAdmin(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json(
        { error: '새 비밀번호를 입력해주세요.' },
        { status: 400 },
      )
    }

    // Phase 9b: 비밀번호 정책 검증
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: '비밀번호 정책을 충족하지 않습니다.',
          details: validation.errors,
          policy: getPasswordPolicyDescription(),
        },
        { status: 400 },
      )
    }

    const admin = await adminRepository.getAdminById(id)
    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const result = await adminRepository.resetPassword(id, newPassword, adminPayload.sub)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      )
    }

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'PASSWORD_RESET',
      entityType: 'Admin',
      entityId: id,
      metadata: {
        targetLoginId: admin.loginId,
        targetName: admin.name,
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: `/api/admin/admins/${id}/reset-password`,
    })

    return NextResponse.json({
      success: true,
      message: '비밀번호가 초기화되었습니다.',
    })
  }
  catch (error) {
    logger.apiError(request, 'Reset password error', { error })
    return NextResponse.json(
      { error: '비밀번호 초기화 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
