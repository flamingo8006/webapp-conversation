import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import { trackFeedbackStats } from '@/lib/stats-helper'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string, messageId: string }> },
) {
  try {
    const { appId, messageId } = await params
    const body = await request.json()
    const { rating } = body

    // 챗봇 앱 조회
    const app = await getChatbotAppWithKey(appId)
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 인증/익명 사용자 구분
    const user = await getUserFromRequest(request)
    const sessionId = request.headers.get('x-session-id')

    let difyUser: string

    if (app.isPublic && app.allowAnonymous && sessionId && !user) {
      difyUser = `anon_${appId}:${sessionId}`
    }
    else {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }
      difyUser = `user_${appId}:${user.empNo}`
    }

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)
    const { data } = await client.messageFeedback(messageId, rating, difyUser)

    // 피드백 통계 집계 (like/dislike만, 취소는 제외)
    if (rating === 'like' || rating === 'dislike') {
      trackFeedbackStats(appId, rating)
    }

    return NextResponse.json(data)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Message feedback error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
