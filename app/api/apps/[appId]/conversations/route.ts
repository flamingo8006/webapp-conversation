import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'

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
    const isAnonymous = request.headers.get('x-is-anonymous') === 'true'

    let difyUser: string

    // 공개 챗봇 + 익명 허용
    if (app.isPublic && app.allowAnonymous && isAnonymous && sessionId) {
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

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // 대화 목록 조회
    const { data }: any = await client.getConversations(difyUser)

    return NextResponse.json(data)
  }
  catch (error: any) {
    console.error('Get conversations error:', error)
    return NextResponse.json({
      data: [],
      error: error.message,
    })
  }
}
