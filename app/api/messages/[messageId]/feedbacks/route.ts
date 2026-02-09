import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ messageId: string }>
}) {
  try {
    const body = await request.json()
    const {
      rating,
    } = body
    const { messageId } = await params
    const { user } = getInfo(request)
    const { data } = await client.messageFeedback(messageId, rating, user)
    return NextResponse.json(data)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Failed to submit feedback', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
