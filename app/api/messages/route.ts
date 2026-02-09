import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'
import type { DifyMessagesResponse } from '@/types/dify'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  try {
    const { data } = await client.getConversationMessages(user, conversationId as string) as { data: DifyMessagesResponse }
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Failed to get messages', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
