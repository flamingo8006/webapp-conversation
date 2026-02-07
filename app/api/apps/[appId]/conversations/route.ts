import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getSessionsByAppAndUser } from '@/lib/repositories/chat-session'
import type { DifyConversation, DifyConversationsResponse } from '@/types/dify'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params

    // 챗봇 앱 조회
    const app = await getChatbotAppWithKey(appId)
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 },
      )
    }

    // Phase 7: 인증/익명 사용자 구분
    const user = await getUserFromRequest(request)
    const sessionId = request.headers.get('x-session-id')
    // middleware의 x-is-anonymous 헤더 또는 sessionId 존재 여부로 익명 판단
    const _isAnonymous = request.headers.get('x-is-anonymous') === 'true' || (!user && !!sessionId)

    let difyUser: string
    let dbUserId: string | undefined
    let dbSessionId: string | undefined

    // 공개 챗봇 + 익명 허용 (sessionId가 있고 user가 없으면 익명)
    if (app.isPublic && app.allowAnonymous && sessionId && !user) {
      difyUser = `anon_${appId}:${sessionId}`
      dbSessionId = sessionId
    }
    else {
      // 인증 사용자 처리
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }

      difyUser = `user_${appId}:${user.empNo}`
      dbUserId = user.empNo
    }

    // Dify 대화 목록과 DB 세션을 병렬 조회
    const client = new ChatClient(app.apiKey, app.apiUrl)
    const [difyResult, dbSessions] = await Promise.all([
      client.getConversations(difyUser),
      getSessionsByAppAndUser(appId, dbUserId, dbSessionId),
    ])

    const { data: difyData } = difyResult as { data: DifyConversationsResponse }

    // DB 세션을 difyConversationId로 매핑 (활성 + 삭제 모두 포함)
    const activeSessionMap = new Map<string, { dbSessionId: string, isPinned: boolean, pinnedAt: Date | null, customTitle: string | null }>()
    const deletedConversationIds = new Set<string>()

    for (const s of dbSessions) {
      if (s.difyConversationId) {
        if (s.isActive) {
          activeSessionMap.set(s.difyConversationId, {
            dbSessionId: s.id,
            isPinned: s.isPinned,
            pinnedAt: s.pinnedAt,
            customTitle: s.customTitle,
          })
        }
        else {
          // 삭제된 세션의 dify conversation_id 기록
          deletedConversationIds.add(s.difyConversationId)
        }
      }
    }

    // Dify 대화 목록에서 삭제된 대화 필터링 후 DB 정보 머지
    const conversations = (difyData?.data || [])
      .filter((conv: DifyConversation) => !deletedConversationIds.has(conv.id))
      .map((conv: DifyConversation) => {
        const dbInfo = activeSessionMap.get(conv.id)
        return {
          ...conv,
          // customTitle이 있으면 name 덮어쓰기
          name: dbInfo?.customTitle || conv.name,
          // DB 정보 추가
          dbSessionId: dbInfo?.dbSessionId || null,
          isPinned: dbInfo?.isPinned || false,
          pinnedAt: dbInfo?.pinnedAt || null,
        }
      })

    return NextResponse.json({
      ...difyData,
      data: conversations,
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Get conversations error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({
      data: [],
      error: message,
    }, { status: 500 })
  }
}
