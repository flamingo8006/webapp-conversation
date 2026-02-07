import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'
import type { DifyMessagesResponse } from '@/types/dify'

export async function GET(request: NextRequest) {
  const { sessionId, user } = getInfo(request)
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  const { data } = await client.getConversationMessages(user, conversationId as string) as { data: DifyMessagesResponse }
  return NextResponse.json(data, {
    headers: setSession(sessionId),
  })
}
