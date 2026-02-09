import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { adminGroupRepository } from '@/lib/repositories/admin-group'
import { adminRepository } from '@/lib/repositories/admin'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// PATCH - 멤버 역할 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string, adminId: string }> },
) {
  const admin = await requireSuperAdmin(request)

  if (!admin) {
    return NextResponse.json(
      { error: '슈퍼관리자 권한이 필요합니다.' },
      { status: 403 },
    )
  }

  try {
    const { groupId, adminId } = await params

    // 관리자 존재 및 그룹 소속 확인
    const targetAdmin = await adminRepository.getAdminById(adminId)
    if (!targetAdmin || targetAdmin.groupId !== groupId) {
      return NextResponse.json(
        { error: '해당 그룹의 멤버가 아닙니다.' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { groupRole } = body

    if (!groupRole || !['group_admin', 'member'].includes(groupRole)) {
      return NextResponse.json(
        { error: 'groupRole은 group_admin 또는 member여야 합니다.' },
        { status: 400 },
      )
    }

    const member = await adminGroupRepository.updateMemberRole(adminId, groupRole)

    return NextResponse.json(member)
  }
  catch (error) {
    logger.apiError(request, 'Failed to update member role', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '멤버 역할 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// DELETE - 멤버 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string, adminId: string }> },
) {
  const admin = await requireSuperAdmin(request)

  if (!admin) {
    return NextResponse.json(
      { error: '슈퍼관리자 권한이 필요합니다.' },
      { status: 403 },
    )
  }

  try {
    const { groupId, adminId } = await params

    // 관리자 존재 및 그룹 소속 확인
    const targetAdmin = await adminRepository.getAdminById(adminId)
    if (!targetAdmin || targetAdmin.groupId !== groupId) {
      return NextResponse.json(
        { error: '해당 그룹의 멤버가 아닙니다.' },
        { status: 404 },
      )
    }

    await adminGroupRepository.removeMember(adminId)

    return NextResponse.json({ success: true })
  }
  catch (error) {
    logger.apiError(request, 'Failed to remove group member', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '멤버 제거 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
