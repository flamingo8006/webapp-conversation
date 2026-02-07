import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { listPublicChatbotApps } from '@/lib/repositories/chatbot-app'
import { errorCapture } from '@/lib/error-capture'

/**
 * GET - 공개 챗봇 목록 조회
 * 익명 사용자도 접근 가능
 */
export async function GET(request: NextRequest) {
  try {
    const apps = await listPublicChatbotApps()
    return NextResponse.json(apps)
  }
  catch (error) {
    console.error('Failed to list public apps:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
