import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getChatbotAppById } from '@/lib/repositories/chatbot-app'
import { errorCapture } from '@/lib/error-capture'

/**
 * GET - 챗봇 정보 조회 (공개 API)
 * 익명 사용자도 접근 가능 (API Key 제외)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    // 챗봇 앱 조회 (API Key 제외)
    const app = await getChatbotAppById(appId)

    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 비공개 챗봇은 조회 불가
    if (!app.isPublic) {
      return NextResponse.json(
        { error: 'This chatbot is not public' },
        { status: 403 },
      )
    }

    return NextResponse.json(app)
  }
  catch (error) {
    console.error('Failed to get app info:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
