import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { adminGroupRepository } from '@/lib/repositories/admin-group'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// GET - 그룹 상세 조회
export async function GET(
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
    const group = await adminGroupRepository.getGroupById(groupId)

    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const members = await adminGroupRepository.listMembers(groupId)
    const apps = await adminGroupRepository.listGroupApps(groupId)

    return NextResponse.json({ ...group, members, apps })
  }
  catch (error) {
    logger.apiError(request, 'Failed to get group', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '그룹 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// PATCH - 그룹 수정
export async function PATCH(
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
    const existing = await adminGroupRepository.getGroupById(groupId)

    if (!existing) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { name, description, isActive } = body

    const group = await adminGroupRepository.updateGroup(groupId, {
      name: name?.trim(),
      description: description !== undefined ? description?.trim() || null : undefined,
      isActive,
      updatedBy: admin.sub,
    })

    return NextResponse.json(group)
  }
  catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 그룹 이름입니다.' },
        { status: 409 },
      )
    }
    logger.apiError(request, 'Failed to update group', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '그룹 수정 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// DELETE - 그룹 삭제 (소프트 삭제)
export async function DELETE(
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
    const existing = await adminGroupRepository.getGroupById(groupId)

    if (!existing) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    await adminGroupRepository.deleteGroup(groupId, admin.sub)

    return NextResponse.json({ success: true })
  }
  catch (error) {
    logger.apiError(request, 'Failed to delete group', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '그룹 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
