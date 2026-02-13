import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth, getAdminVisibleAppIds } from '@/lib/admin-auth'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'
import prisma from '@/lib/prisma'
import {
  createChatbotApp,
} from '@/lib/repositories/chatbot-app'

// GET - 챗봇 목록 조회
// super_admin: 전체 챗봇 조회
// admin: 같은 그룹의 챗봇 + 본인이 생성한 챗봇
export async function GET(request: NextRequest) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    const visibleAppIds = await getAdminVisibleAppIds(admin)

    const apps = await prisma.chatbotApp.findMany({
      where: {
        isActive: true,
        ...(visibleAppIds ? { id: { in: visibleAppIds } } : {}),
      },
      include: {
        group: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // apiKeyEncrypted 제거
    const result = apps.map(({ apiKeyEncrypted, deletedAt, deletedBy, updatedAt, updatedBy, ...app }) => app)

    return NextResponse.json(result)
  }
  catch (error) {
    logger.apiError(request, 'Failed to list apps', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST - 챗봇 생성
export async function POST(request: NextRequest) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      nameKo,
      nameEn,
      descriptionKo,
      descriptionEn,
      difyAppId,
      apiKey,
      apiUrl,
      iconUrl,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs,
      showWorkflowSteps,
      groupId,
    } = body

    // 필수 필드 검증
    if (!name || !difyAppId || !apiKey) {
      return NextResponse.json(
        { error: 'name, difyAppId, apiKey are required' },
        { status: 400 },
      )
    }

    // maxAnonymousMsgs를 숫자로 변환 (빈 문자열이나 null은 null로 처리)
    const parsedMaxAnonymousMsgs = maxAnonymousMsgs === '' || maxAnonymousMsgs === null || maxAnonymousMsgs === undefined
      ? undefined
      : parseInt(maxAnonymousMsgs, 10)

    // 챗봇 앱 생성 (API Key 암호화 저장)
    const app = await createChatbotApp({
      name,
      description,
      nameKo,
      nameEn,
      descriptionKo,
      descriptionEn,
      difyAppId,
      apiKey, // 평문으로 전달, repository에서 암호화
      apiUrl,
      iconUrl,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs: parsedMaxAnonymousMsgs,
      showWorkflowSteps: showWorkflowSteps ?? true,
      groupId: groupId || undefined,
      createdBy: admin.sub,
    })

    return NextResponse.json(app, { status: 201 })
  }
  catch (error) {
    logger.apiError(request, 'Failed to create app', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
