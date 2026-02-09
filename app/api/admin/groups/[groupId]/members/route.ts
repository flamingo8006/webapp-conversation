import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { adminGroupRepository } from '@/lib/repositories/admin-group'
import { adminRepository } from '@/lib/repositories/admin'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// POST - 멤버 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const admin = await requireSuperAdmin(request)

  if (!admin) {
    return NextResponse.json(
      { error: '슈퍼관리자 권한이 필요합니다.' },
      { status: 403 },
    )
  }

  try {
    const { groupId } = await params

    // 그룹 존재 확인
    const group = await adminGroupRepository.getGroupById(groupId)
    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { adminId, groupRole } = body

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId는 필수입니다.' },
        { status: 400 },
      )
    }

    // 관리자 존재 확인
    const targetAdmin = await adminRepository.getAdminById(adminId)
    if (!targetAdmin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    // 이미 다른 그룹에 속해 있는지 확인
    if (targetAdmin.groupId && targetAdmin.groupId !== groupId) {
      return NextResponse.json(
        { error: '이미 다른 그룹에 소속되어 있습니다. 먼저 기존 그룹에서 제거해주세요.' },
        { status: 400 },
      )
    }

    const role = groupRole === 'group_admin' ? 'group_admin' : 'member'
    const member = await adminGroupRepository.addMember(groupId, adminId, role)

    return NextResponse.json(member, { status: 201 })
  }
  catch (error) {
    logger.apiError(request, 'Failed to add group member', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '멤버 추가 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
