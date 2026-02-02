import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import {
  listChatbotApps,
  createChatbotApp,
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

// GET - 챗봇 목록 조회
export async function GET(request: NextRequest) {
  const user = await requireAdmin(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const apps = await listChatbotApps()
    return NextResponse.json(apps)
  }
  catch (error) {
    console.error('Failed to list apps:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 챗봇 생성
export async function POST(request: NextRequest) {
  const user = await requireAdmin(request)

  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      difyAppId,
      apiKey,
      apiUrl,
      iconUrl,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs,
    } = body

    // 필수 필드 검증
    if (!name || !difyAppId || !apiKey) {
      return NextResponse.json(
        { error: 'name, difyAppId, apiKey are required' },
        { status: 400 }
      )
    }

    // 챗봇 앱 생성 (API Key 암호화 저장)
    const app = await createChatbotApp({
      name,
      description,
      difyAppId,
      apiKey, // 평문으로 전달, repository에서 암호화
      apiUrl,
      iconUrl,
      isPublic,
      requireAuth,
      allowAnonymous,
      maxAnonymousMsgs,
      createdBy: user.empNo,
    })

    return NextResponse.json(app, { status: 201 })
  }
  catch (error) {
    console.error('Failed to create app:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
