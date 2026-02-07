import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 관리자 상세 조회 (슈퍼관리자 전용)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminPayload = await requireSuperAdmin(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const admin = await adminRepository.getAdminById(id)

    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ admin })
  }
  catch (error) {
    logger.apiError(request, 'Get admin error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '관리자 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// 관리자 수정 (슈퍼관리자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { name, email, department, role, isActive } = body

    const oldAdmin = await adminRepository.getAdminById(id)
    if (!oldAdmin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    // 자기 자신의 역할은 변경 불가
    if (id === adminPayload.sub && role && role !== oldAdmin.role) {
      return NextResponse.json(
        { error: '자신의 역할은 변경할 수 없습니다.' },
        { status: 400 },
      )
    }

    const admin = await adminRepository.updateAdmin(id, {
      name,
      email,
      department,
      role,
      isActive,
      updatedBy: adminPayload.sub,
    })

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'UPDATE',
      entityType: 'Admin',
      entityId: id,
      changes: {
        before: { name: oldAdmin.name, email: oldAdmin.email, department: oldAdmin.department, role: oldAdmin.role, isActive: oldAdmin.isActive },
        after: { name: admin?.name, email: admin?.email, department: admin?.department, role: admin?.role, isActive: admin?.isActive },
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: `/api/admin/admins/${id}`,
    })

    return NextResponse.json({ admin })
  }
  catch (error) {
    logger.apiError(request, 'Update admin error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '관리자 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// 관리자 삭제 (비활성화, 슈퍼관리자 전용)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminPayload = await requireSuperAdmin(request)

    if (!adminPayload) {
      return NextResponse.json(
        { error: '슈퍼관리자 권한이 필요합니다.' },
        { status: 403 },
      )
    }

    const { id } = await params

    // 자기 자신 삭제 불가
    if (id === adminPayload.sub) {
      return NextResponse.json(
        { error: '자기 자신을 삭제할 수 없습니다.' },
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

    await adminRepository.deleteAdmin(id, adminPayload.sub)

    // 감사 로그
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await auditLogger.log({
      ...getActorInfo(adminPayload),
      action: 'DELETE',
      entityType: 'Admin',
      entityId: id,
      changes: {
        before: { loginId: admin.loginId, name: admin.name, isActive: true },
        after: { isActive: false },
      },
      success: true,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      requestPath: `/api/admin/admins/${id}`,
    })

    return NextResponse.json({ success: true })
  }
  catch (error) {
    logger.apiError(request, 'Delete admin error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '관리자 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
