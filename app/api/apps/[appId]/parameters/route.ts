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

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // 앱 파라미터 조회
    const { data } = await client.getApplicationParameters(difyUser)

    return NextResponse.json(data as object)
  }
  catch (error: unknown) {
    console.error('Get parameters error:', error)
    return NextResponse.json([])
  }
}
