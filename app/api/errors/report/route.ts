import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { errorCapture } from '@/lib/error-capture'

// 클라이언트 에러 리포트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, message, stack, sessionId, appId } = body

    if (!message) {
      return NextResponse.json(
        { error: '에러 메시지가 필요합니다.' },
        { status: 400 },
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await errorCapture.captureClientError(
      { type: type || 'ClientError', message, stack },
      {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        sessionId,
        appId,
      },
    )

    return NextResponse.json({ success: true })
  }
  catch (error) {
    console.error('Error report error:', error)
    return NextResponse.json(
      { error: '에러 리포트 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
