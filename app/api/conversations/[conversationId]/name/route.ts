import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  try {
    const body = await request.json()
    const {
      auto_generate,
      name,
    } = body
    const { conversationId } = await params
    const { user } = getInfo(request)

    // auto generate name
    const { data } = await client.renameConversation(conversationId, name, user, auto_generate)
    return NextResponse.json(data)
  }
  catch (error) {
    // Multi-App 환경에서는 전역 client가 작동하지 않을 수 있음
    // 에러를 조용히 처리하고 빈 응답 반환
    logger.apiWarn(request, 'Failed to rename conversation', { error })
    return NextResponse.json({ name: '' }, { status: 200 })
  }
}
