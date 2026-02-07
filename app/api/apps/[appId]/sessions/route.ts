import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import {
  findOrCreateSession,
  getUserSessions,
  saveMessage,
} from '@/lib/repositories/chat-session'
import { errorCapture } from '@/lib/error-capture'

// GET - 사용자의 세션 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const sessions = await getUserSessions(user.empNo, appId)

    return NextResponse.json(sessions)
  }
  catch (error) {
    console.error('Get sessions error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST - 세션 생성 또는 메시지 저장
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { action, difyConversationId, message } = body

    if (action === 'create_or_get_session') {
      // 세션 조회 또는 생성
      const session = await findOrCreateSession({
        userId: user.empNo,
        userLoginId: user.loginId,
        userName: user.name,
        appId,
        difyConversationId,
      })

      return NextResponse.json(session)
    }

    if (action === 'save_message') {
      // 메시지 저장
      if (!message || !message.sessionId) {
        return NextResponse.json(
          { error: 'sessionId and message are required' },
          { status: 400 },
        )
      }

      const savedMessage = await saveMessage({
        sessionId: message.sessionId,
        difyMessageId: message.difyMessageId,
        role: message.role,
        content: message.content,
        files: message.files,
        tokenCount: message.tokenCount,
      })

      return NextResponse.json(savedMessage)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 },
    )
  }
  catch (error) {
    console.error('Session action error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
