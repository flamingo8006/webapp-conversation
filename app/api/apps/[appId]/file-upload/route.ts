import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function POST(
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

    // FormData 파싱
    const formData = await request.formData()

    // 동적으로 ChatClient 생성
    const client = new ChatClient(app.apiKey, app.apiUrl)

    // Dify user ID 추가
    const difyUser = `user_${appId}:${user.empNo}`
    formData.append('user', difyUser)

    // 파일 업로드
    const res = await client.fileUpload(formData)

    return new Response(res.data.id as any)
  }
  catch (error: any) {
    console.error('File upload error:', error)
    return new Response(error.message, { status: 500 })
  }
}
