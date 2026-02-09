import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    // Multi-App 환경에서는 전역 client가 작동하지 않을 수 있음 — 빈 배열 폴백은 의도적
    logger.apiWarn(request, 'Failed to get parameters, returning empty fallback', { error })
    return NextResponse.json([])
  }
}
