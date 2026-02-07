import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'
import type { DifyConversationsResponse } from '@/types/dify'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  try {
    const { data } = await client.getConversations(user) as { data: DifyConversationsResponse }
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      data: [],
      error: message,
    })
  }
}
