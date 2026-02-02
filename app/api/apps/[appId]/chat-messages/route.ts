import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getOrCreateSession, getAnonymousMessageCount, saveMessage } from '@/lib/repositories/chat-session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    // 챗봇 앱 조회 (복호화된 API Key 포함)
    const app = await getChatbotAppWithKey(appId)
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // Phase 7: 인증/익명 사용자 구분
    const user = await getUserFromRequest(request)
    const sessionId = request.headers.get('x-session-id')
    // middleware의 x-is-anonymous 헤더 또는 sessionId 존재 여부로 익명 판단
    const isAnonymous = request.headers.get('x-is-anonymous') === 'true' || (!user && !!sessionId)

    let difyUser: string
    let session

    // 공개 챗봇 + 익명 허용 (sessionId가 있고 user가 없으면 익명)
    if (app.isPublic && app.allowAnonymous && sessionId && !user) {
      // 익명 사용자 처리
      session = await getOrCreateSession({
        appId,
        sessionId,
        isAnonymous: true,
      })

      // 메시지 제한 체크
      if (app.maxAnonymousMsgs) {
        const msgCount = await getAnonymousMessageCount(sessionId, appId)
        if (msgCount >= app.maxAnonymousMsgs) {
          return NextResponse.json(
            { error: `Anonymous message limit reached (max: ${app.maxAnonymousMsgs})` },
            { status: 429 },
          )
        }
      }

      difyUser = `anon_${appId}:${sessionId}`
    }
    else {
      // 인증 사용자 처리
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }

      session = await getOrCreateSession({
        appId,
        userId: user.empNo,
        userLoginId: user.loginId,
        userName: user.name,
        isAnonymous: false,
      })

      difyUser = `user_${appId}:${user.empNo}`
    }

    // 요청 본문 파싱
    const body = await request.json()
    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body

    // 익명 사용자 메시지 저장 (제한 카운트용)
    if (isAnonymous && session) {
      await saveMessage({
        sessionId: session.id,
        role: 'user',
        content: query,
        files,
      })
    }

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // 채팅 메시지 전송 (SSE)
    const res = await client.createChatMessage(
      inputs,
      query,
      difyUser,
      responseMode,
      conversationId,
      files,
    )

    return new Response(res.data as any)
  }
  catch (error) {
    console.error('Chat message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
