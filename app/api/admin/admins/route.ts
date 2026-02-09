import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { adminGroupRepository } from '@/lib/repositories/admin-group'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// 관리자 목록 조회 (슈퍼관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const adminPayload = await requireSuperAdmin(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const role = searchParams.get('role') || undefined

    const admins = await adminRepository.listAdmins({ includeInactive, role })
    const counts = await adminRepository.countAdmins()

    return NextResponse.json({ admins, counts })
  }
  catch (error) {
    logger.apiError(request, 'List admins error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '관리자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// 관리자 생성 (슈퍼관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const adminPayload = await requireSuperAdmin(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { loginId, password, name, email, department, role, groupId } = body

    // 유효성 검사
    if (!loginId || !password || !name) {
      return NextResponse.json(
        { error: '로그인 ID, 비밀번호, 이름은 필수입니다.' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 },
      )
    }

    // 중복 확인
    const existing = await adminRepository.getAdminByLoginId(loginId)
    if (existing) {
      return NextResponse.json(
        { error: '이미 사용 중인 로그인 ID입니다.' },
        { status: 400 },
      )
    }

    const admin = await adminRepository.createAdmin({
      loginId,
      password,
      name,
      email,
      department,
      role: role || 'admin',
      createdBy: adminPayload.sub,
    })

    // 그룹 배정
    if (groupId) {
      await adminGroupRepository.addMember(groupId, admin.id, 'member')
    }

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'CREATE',
      entityType: 'Admin',
      entityId: admin.id,
      changes: {
        after: { loginId: admin.loginId, name: admin.name, role: admin.role },
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: '/api/admin/admins',
    })

    return NextResponse.json({ admin }, { status: 201 })
  }
  catch (error) {
    logger.apiError(request, 'Create admin error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '관리자 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
