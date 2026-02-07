import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getAnonymousMessageCount } from '@/lib/repositories/chat-session'

export async function POST(
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

    // Phase 8: 인증/익명 사용자 구분
    const user = await getUserFromRequest(request)
    const sessionId = request.headers.get('x-session-id')

    let difyUser: string

    // 공개 챗봇 + 익명 허용 (sessionId가 있고 user가 없으면 익명)
    if (app.isPublic && app.allowAnonymous && sessionId && !user) {
      // 익명 사용자 메시지 제한 체크
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

      difyUser = `user_${appId}:${user.empNo}`
    }

    // FormData 파싱
    const formData = await request.formData()

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // Dify user ID 추가
    formData.append('user', difyUser)

    // 파일 업로드
    const res = await client.fileUpload(formData)

    return new Response(String(res.data.id))
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('File upload error:', error)
    return new Response(message, { status: 500 })
  }
}
