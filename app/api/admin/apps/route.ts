import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import {
  listChatbotApps,
  createChatbotApp,
} from '@/lib/repositories/chatbot-app'

// GET - 챗봇 목록 조회
// super_admin: 전체 챗봇 조회
// admin: 본인이 생성한 챗봇만 조회
export async function GET(request: NextRequest) {
  const admin = await requireAdminAuth(request)

  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    )
  }

  try {
    // super_admin은 전체, 일반 admin은 본인 챗봇만
    const createdBy = admin.role === 'super_admin' ? null : admin.sub
    const apps = await listChatbotApps(createdBy)
    return NextResponse.json(apps)
  }
  catch (error) {
    console.error('Failed to list apps:', error)
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
      ? null
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
      createdBy: admin.sub,
    })

    return NextResponse.json(app, { status: 201 })
  }
  catch (error) {
    console.error('Failed to create app:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
