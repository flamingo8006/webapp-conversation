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

    // 사용자 인증 확인
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // 챗봇 앱 조회
    const app = await getChatbotAppWithKey(appId)
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // Dify user ID
    const difyUser = `user_${appId}:${user.empNo}`

    // 앱 파라미터 조회
    const { data } = await client.getApplicationParameters(difyUser)

    return NextResponse.json(data as object)
  }
  catch (error: any) {
    console.error('Get parameters error:', error)
    return NextResponse.json([])
  }
}
