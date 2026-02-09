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
    // Multi-App 환경에서는 전역 client가 작동하지 않을 수 있음 — 200 반환은 의도적
    // (레거시 API 실패가 Multi-App에서는 정상 시나리오)
    logger.apiWarn(request, 'Failed to rename conversation', { error })
    return NextResponse.json({ name: '' }, { status: 200 })
  }
}
