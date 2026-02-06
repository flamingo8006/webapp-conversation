import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Readable } from 'stream'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getOrCreateSession, getAnonymousMessageCount, saveMessage, updateSessionConversationId } from '@/lib/repositories/chat-session'

// SSE 이벤트 파싱 유틸리티 (버퍼 기반 - 청크 경계 처리)
function createSSEParser() {
  let buffer = ''

  return {
    parse(chunk: string): { event?: string, data?: string }[] {
      buffer += chunk
      const events: { event?: string, data?: string }[] = []

      // 완전한 이벤트 블록만 처리 (마지막 불완전 블록은 버퍼에 유지)
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || '' // 마지막 부분은 불완전할 수 있으므로 버퍼에 유지

      for (const block of parts) {
        if (!block.trim())
        { continue }

        const lines = block.split('\n')
        let event: string | undefined
        let data: string | undefined

        for (const line of lines) {
          if (line.startsWith('event:')) {
            event = line.slice(6).trim()
          }
          else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }
        }

        if (event || data) {
          events.push({ event, data })
        }
      }

      return events
    },
    // 스트림 종료 시 남은 버퍼 처리
    flush(): { event?: string, data?: string }[] {
      if (!buffer.trim()) { return [] }
      const events: { event?: string, data?: string }[] = []
      const lines = buffer.split('\n')
      let event: string | undefined
      let data: string | undefined

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim()
        }
        else if (line.startsWith('data:')) {
          data = line.slice(5).trim()
        }
      }

      if (event || data) {
        events.push({ event, data })
      }

      buffer = ''
      return events
    },
  }
}

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
    const _isAnonymous = request.headers.get('x-is-anonymous') === 'true' || (!user && !!sessionId)

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

    // 사용자 메시지 저장 (익명/인증 모두)
    let userMessageId: string | undefined
    if (session) {
      const userMessage = await saveMessage({
        sessionId: session.id,
        role: 'user',
        content: query,
        files,
      })
      userMessageId = userMessage.id
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

    // axios 응답은 Node.js Readable stream
    const nodeStream = res.data as Readable
    const dbSessionId = session?.id
    const parentMsgId = userMessageId // SSE 핸들러에서 사용할 user 메시지 ID

    // 메시지 수집용 변수
    let fullAnswer = ''
    let messageId = ''
    let newConversationId = ''
    let totalTokens = 0
    const sseParser = createSSEParser()

    // SSE 이벤트 처리 함수
    function processSSEEvents(events: { event?: string, data?: string }[]) {
      for (const event of events) {
        if (!event.data)
        { continue }

        try {
          const data = JSON.parse(event.data)
          const eventType = event.event || data.event

          if (eventType === 'message' && data.answer) {
            fullAnswer += data.answer
          }

          if (eventType === 'message_end') {
            messageId = data.message_id || ''
            newConversationId = data.conversation_id || ''
            totalTokens = data.metadata?.usage?.total_tokens || 0
          }
        }
        catch {
          // JSON 파싱 실패 무시
        }
      }
    }

    // Node.js stream을 Web ReadableStream으로 변환하면서 데이터 수집
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          // 클라이언트에 데이터 전달
          controller.enqueue(chunk)

          // 텍스트로 변환하여 버퍼 기반 파싱
          const text = chunk.toString('utf-8')
          const events = sseParser.parse(text)
          processSSEEvents(events)
        })

        nodeStream.on('end', async () => {
          // 남은 버퍼 처리
          const remainingEvents = sseParser.flush()
          processSSEEvents(remainingEvents)

          // 스트림 종료 시 assistant 메시지 저장
          if (dbSessionId && fullAnswer) {
            try {
              await saveMessage({
                sessionId: dbSessionId,
                difyMessageId: messageId,
                parentMessageId: parentMsgId, // user 메시지와 연결
                role: 'assistant',
                content: fullAnswer,
                tokenCount: totalTokens,
              })

              // conversation_id 업데이트 (새 대화인 경우)
              if (newConversationId) {
                await updateSessionConversationId(dbSessionId, newConversationId)
              }
            }
            catch (error) {
              console.error('Failed to save assistant message:', error)
            }
          }

          controller.close()
        })

        nodeStream.on('error', (error) => {
          console.error('Stream error:', error)
          controller.error(error)
        })
      },
    })

    return new Response(webStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
  catch (error) {
    console.error('Chat message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
