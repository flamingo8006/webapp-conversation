import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionById, updateSessionTitle, toggleSessionPin, softDeleteSession, getSessionByDifyConversationId } from '@/lib/repositories/chat-session'
import { getUserFromRequest } from '@/lib/auth-utils'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ appId: string, sessionId: string }>
}

/**
 * PATCH /api/apps/[appId]/sessions/[sessionId]
 * 세션 업데이트 (제목 변경, 고정/고정해제)
 * Note: sessionId는 DB session ID 또는 Dify conversation_id일 수 있음
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { appId, sessionId: paramSessionId } = await params
    const body = await request.json()
    const { action, customTitle, isPinned } = body

    // 세션 존재 확인 - DB ID 또는 Dify conversation_id로 조회
    let session = await getSessionById(paramSessionId)
    if (!session || session.appId !== appId) {
      // Dify conversation_id로 재시도
      session = await getSessionByDifyConversationId(appId, paramSessionId)
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const dbSessionId = session.id

    // 권한 확인: 인증 사용자 또는 익명 사용자 (chat-messages 라우트와 동일한 패턴)
    const user = await getUserFromRequest(request)
    const anonymousSessionId = request.headers.get('x-session-id')
    const isAnonymous = request.headers.get('x-is-anonymous') === 'true' || (!user && !!anonymousSessionId)

    if (user) {
      // 인증 사용자: 자신의 세션인지 확인
      if (session.userId && session.userId !== user.empNo) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else if (isAnonymous && anonymousSessionId) {
      // 익명 사용자: 자신의 세션인지 확인
      if (!session.isAnonymous || session.sessionId !== anonymousSessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let updatedSession

    switch (action) {
      case 'rename':
        if (typeof customTitle !== 'string') {
          return NextResponse.json({ error: 'customTitle is required' }, { status: 400 })
        }
        updatedSession = await updateSessionTitle(dbSessionId, customTitle)
        break

      case 'pin':
        if (typeof isPinned !== 'boolean') {
          return NextResponse.json({ error: 'isPinned is required' }, { status: 400 })
        }
        updatedSession = await toggleSessionPin(dbSessionId, isPinned)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, session: updatedSession })
  } catch (error) {
    logger.apiError(request, 'Session update error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/apps/[appId]/sessions/[sessionId]
 * 세션 소프트 삭제
 * Note: sessionId는 DB session ID 또는 Dify conversation_id일 수 있음
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { appId, sessionId: paramSessionId } = await params

    // 세션 존재 확인 - DB ID 또는 Dify conversation_id로 조회
    let session = await getSessionById(paramSessionId)
    if (!session || session.appId !== appId) {
      // Dify conversation_id로 재시도
      session = await getSessionByDifyConversationId(appId, paramSessionId)
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const dbSessionId = session.id

    // 권한 확인 (chat-messages 라우트와 동일한 패턴)
    const user = await getUserFromRequest(request)
    const anonymousSessionId = request.headers.get('x-session-id')
    const isAnonymous = request.headers.get('x-is-anonymous') === 'true' || (!user && !!anonymousSessionId)

    if (user) {
      if (session.userId && session.userId !== user.empNo) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else if (isAnonymous && anonymousSessionId) {
      if (!session.isAnonymous || session.sessionId !== anonymousSessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await softDeleteSession(dbSessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.apiError(request, 'Session delete error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
