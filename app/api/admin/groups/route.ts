import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { adminGroupRepository } from '@/lib/repositories/admin-group'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

// GET - 그룹 목록 조회 (super_admin 전용)
export async function GET(request: NextRequest) {
  const admin = await requireSuperAdmin(request)

  if (!admin) {
    return NextResponse.json(
      { error: '슈퍼관리자 권한이 필요합니다.' },
      { status: 403 },
    )
  }

  try {
    const groups = await adminGroupRepository.listGroups({ includeInactive: true })
    return NextResponse.json({ groups })
  }
  catch (error) {
    logger.apiError(request, 'Failed to list groups', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '그룹 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

// POST - 그룹 생성 (super_admin 전용)
export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin(request)

  if (!admin) {
    return NextResponse.json(
      { error: '슈퍼관리자 권한이 필요합니다.' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '그룹 이름은 필수입니다.' },
        { status: 400 },
      )
    }

    const group = await adminGroupRepository.createGroup({
      name: name.trim(),
      description: description?.trim() || undefined,
      createdBy: admin.sub,
    })

    return NextResponse.json(group, { status: 201 })
  }
  catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 그룹 이름입니다.' },
        { status: 409 },
      )
    }
    logger.apiError(request, 'Failed to create group', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '그룹 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
