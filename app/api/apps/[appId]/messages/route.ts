import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import type { DifyMessage, DifyMessageFile, DifyMessagesResponse } from '@/types/dify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    // 챗봇 앱 조회
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

    // 공개 챗봇 + 익명 허용 (sessionId가 있고 user가 없으면 익명)
    if (app.isPublic && app.allowAnonymous && sessionId && !user) {
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

      difyUser = `user_${appId}:${user.empNo}`
    }

    // 쿼리 파라미터에서 conversation_id 추출
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 },
      )
    }

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // 메시지 조회
    const { data } = await client.getConversationMessages(difyUser, conversationId) as { data: DifyMessagesResponse }

    // 파일 URL 변환: 상대 경로를 전체 URL로 변환
    const difyBaseUrl = app.apiUrl?.replace('/v1', '') || ''
    if (difyBaseUrl && data.data) {
      data.data = data.data.map((message: DifyMessage) => {
        if (message.message_files) {
          message.message_files = message.message_files.map((file: DifyMessageFile) => {
            if (file.url && file.url.startsWith('/files/')) {
              file.url = `${difyBaseUrl}${file.url}`
            }
            return file
          })
        }
        return message
      })
    }

    return NextResponse.json(data)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
