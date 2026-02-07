import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAdminFromRequest, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'

// 비밀번호 변경
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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '새 비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 },
      )
    }

    // 현재 비밀번호 확인
    const admin = await adminRepository.getAdminByLoginId(adminPayload.loginId)
    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const isValid = await adminRepository.verifyPassword(admin, currentPassword)
    if (!isValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      )
    }

    // 비밀번호 변경
    await adminRepository.updatePassword(admin.id, newPassword, adminPayload.sub)

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'PASSWORD_CHANGE',
      entityType: 'Admin',
      entityId: admin.id,
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: '/api/admin/auth/password',
    })

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  }
  catch (error) {
    console.error('Change password error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
