import type { NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body
    const { user } = getInfo(request)
    const res = await client.createChatMessage(inputs, query, user, responseMode, conversationId, files)
    return new Response(res.data as ReadableStream)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Failed to create chat message', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
