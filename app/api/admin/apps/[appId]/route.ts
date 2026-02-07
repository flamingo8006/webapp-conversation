import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { errorCapture } from '@/lib/error-capture'
import {
  getChatbotAppById,
  updateChatbotApp,
  deleteChatbotApp,
} from '@/lib/repositories/chatbot-app'

// 권한 체크 헬퍼: super_admin은 모든 챗봇, 일반 admin은 본인 챗봇만
function canAccessApp(adminRole: string, adminId: string, appCreatedBy: string | null): boolean {
  if (adminRole === 'super_admin') { return true }
  return appCreatedBy === adminId
}

// GET - 챗봇 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    const { appId } = await params
    const app = await getChatbotAppById(appId)

    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 권한 체크
    if (!canAccessApp(admin.role, admin.sub, app.createdBy)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own apps' },
        { status: 403 },
      )
    }

    return NextResponse.json(app)
  }
  catch (error) {
    console.error('Failed to get app:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// PUT - 챗봇 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    const { appId } = await params

    // 기존 앱 조회하여 권한 체크
    const existingApp = await getChatbotAppById(appId)
    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 권한 체크
    if (!canAccessApp(admin.role, admin.sub, existingApp.createdBy)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify your own apps' },
        { status: 403 },
      )
    }

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
      isActive,
      sortOrder,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs,
    } = body

    // maxAnonymousMsgs를 숫자로 변환 (빈 문자열이나 null은 null로 처리)
    const parsedMaxAnonymousMsgs = maxAnonymousMsgs === '' || maxAnonymousMsgs === null || maxAnonymousMsgs === undefined
      ? null
      : parseInt(maxAnonymousMsgs, 10)

    // 챗봇 앱 수정 (API Key 제공 시 재암호화)
    const app = await updateChatbotApp(appId, {
      name,
      description,
      nameKo,
      nameEn,
      descriptionKo,
      descriptionEn,
      difyAppId,
      apiKey, // 새 API Key (있는 경우에만 업데이트)
      apiUrl,
      iconUrl,
      isActive,
      sortOrder,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs: parsedMaxAnonymousMsgs,
      updatedBy: admin.sub,
    })

    return NextResponse.json(app)
  }
  catch (error) {
    console.error('Failed to update app:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// DELETE - 챗봇 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    const { appId } = await params

    // 기존 앱 조회하여 권한 체크
    const existingApp = await getChatbotAppById(appId)
    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 권한 체크
    if (!canAccessApp(admin.role, admin.sub, existingApp.createdBy)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own apps' },
        { status: 403 },
      )
    }

    await deleteChatbotApp(appId, admin.sub)

    return NextResponse.json({ success: true })
  }
  catch (error) {
    console.error('Failed to delete app:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
