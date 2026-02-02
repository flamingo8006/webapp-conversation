import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import {
  getChatbotAppById,
  updateChatbotApp,
  deleteChatbotApp,
} from '@/lib/repositories/chatbot-app'

// JWT에서 사용자 정보 추출 헬퍼
async function getUserFromRequest(request: NextRequest) {
  let token = request.cookies.get('auth_token')?.value

  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token)
    return null

  return await verifyToken(token)
}

// 관리자 권한 확인
async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRequest(request)

  if (!user || user.role !== 'admin') {
    return null
  }

  return user
}

// GET - 챗봇 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await requireAdmin(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const { appId } = await params
    const app = await getChatbotAppById(appId)

    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(app)
  }
  catch (error) {
    console.error('Failed to get app:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 챗봇 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await requireAdmin(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const { appId } = await params
    const body = await request.json()
    const {
      name,
      description,
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

    // 챗봇 앱 수정 (API Key 제공 시 재암호화)
    const app = await updateChatbotApp(appId, {
      name,
      description,
      difyAppId,
      apiKey, // 새 API Key (있는 경우에만 업데이트)
      apiUrl,
      iconUrl,
      isActive,
      sortOrder,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs,
      updatedBy: user.empNo,
    })

    return NextResponse.json(app)
  }
  catch (error) {
    console.error('Failed to update app:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 챗봇 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const user = await requireAdmin(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const { appId } = await params

    await deleteChatbotApp(appId, user.empNo)

    return NextResponse.json({ success: true })
  }
  catch (error) {
    console.error('Failed to delete app:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
