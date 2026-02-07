import { prisma } from '@/lib/prisma'
import type { ChatSession, ChatMessage } from '@prisma/client'

interface CreateSessionParams {
  appId: string
  isAnonymous: boolean
  sessionId?: string // 익명 사용자
  userId?: string // 인증 사용자 (empNo)
  userLoginId?: string // 인증 사용자
  userName?: string // 인증 사용자
}

/**
 * 세션 조회 또는 생성
 * Dify conversation_id와 매핑되는 세션을 찾거나 새로 생성
 */
export async function findOrCreateSession(data: {
  userId: string // empNo
  userLoginId: string // loginId
  userName: string
  appId: string
  difyConversationId?: string
}): Promise<ChatSession> {
  // Dify conversation_id가 있으면 기존 세션 찾기
  if (data.difyConversationId) {
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        difyConversationId: data.difyConversationId,
        appId: data.appId,
      },
    })

    if (existingSession) {
      // 마지막 메시지 시간 업데이트
      return await prisma.chatSession.update({
        where: { id: existingSession.id },
        data: { lastMessageAt: new Date() },
      })
    }
  }

  // 새 세션 생성
  return await prisma.chatSession.create({
    data: {
      userId: data.userId,
      userLoginId: data.userLoginId,
      userName: data.userName,
      appId: data.appId,
      difyConversationId: data.difyConversationId,
      lastMessageAt: new Date(),
    },
  })
}

/**
 * 세션 조회 또는 생성 (익명/인증 하이브리드)
 * Phase 7: 익명 사용자 지원
 */
export async function getOrCreateSession(params: CreateSessionParams): Promise<ChatSession> {
  const { appId, isAnonymous, sessionId, userId, userLoginId, userName } = params

  // 익명 사용자 세션 조회
  if (isAnonymous && sessionId) {
    let session = await prisma.chatSession.findFirst({
      where: {
        appId,
        sessionId,
        isAnonymous: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          appId,
          sessionId,
          isAnonymous: true,
        },
      })
    }

    return session
  }

  // 인증 사용자 세션 조회
  if (!isAnonymous && userId) {
    let session = await prisma.chatSession.findFirst({
      where: {
        appId,
        userId,
        isAnonymous: false,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          appId,
          userId,
          userLoginId,
          userName,
          isAnonymous: false,
        },
      })
    }

    return session
  }

  throw new Error('Invalid session parameters')
}

/**
 * 익명 세션 메시지 수 조회
 */
export async function getAnonymousMessageCount(sessionId: string, appId: string): Promise<number> {
  const session = await prisma.chatSession.findFirst({
    where: {
      appId,
      sessionId,
      isAnonymous: true,
      isActive: true,
    },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  })

  return session?._count.messages || 0
}

/**
 * 사용자의 세션 목록 조회
 */
export async function getUserSessions(
  userId: string,
  appId: string,
): Promise<ChatSession[]> {
  return await prisma.chatSession.findMany({
    where: {
      userId,
      appId,
      isActive: true,
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  })
}

/**
 * 세션에 Dify conversation_id 업데이트
 */
export async function updateSessionConversationId(
  sessionId: string,
  difyConversationId: string,
  title?: string,
): Promise<ChatSession> {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      difyConversationId,
      title,
      lastMessageAt: new Date(),
    },
  })
}

/**
 * 메시지 저장
 */
export async function saveMessage(data: {
  sessionId: string
  difyMessageId?: string
  parentMessageId?: string // assistant 메시지가 어떤 user 메시지에 대한 답변인지
  role: 'user' | 'assistant'
  content: string
  files?: Record<string, unknown>
  tokenCount?: number
}): Promise<ChatMessage> {
  return await prisma.chatMessage.create({
    data: {
      sessionId: data.sessionId,
      difyMessageId: data.difyMessageId,
      parentMessageId: data.parentMessageId,
      role: data.role,
      content: data.content,
      files: data.files,
      tokenCount: data.tokenCount,
    },
  })
}

/**
 * 세션의 메시지 목록 조회
 */
export async function getSessionMessages(
  sessionId: string,
): Promise<ChatMessage[]> {
  return await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * 메시지 피드백 업데이트
 */
export async function updateMessageFeedback(
  messageId: string,
  feedback: 'like' | 'dislike',
): Promise<ChatMessage> {
  return await prisma.chatMessage.update({
    where: { id: messageId },
    data: { feedback },
  })
}

/**
 * Phase 8c: 세션 제목 업데이트
 */
export async function updateSessionTitle(
  sessionId: string,
  customTitle: string,
): Promise<ChatSession> {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: { customTitle },
  })
}

/**
 * Phase 8c: 세션 고정/고정해제
 */
export async function toggleSessionPin(
  sessionId: string,
  isPinned: boolean,
): Promise<ChatSession> {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      isPinned,
      pinnedAt: isPinned ? new Date() : null,
    },
  })
}

/**
 * Phase 8c: 세션 소프트 삭제 (isActive=false)
 */
export async function softDeleteSession(
  sessionId: string,
): Promise<ChatSession> {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  })
}

/**
 * Phase 8c: 세션 조회 (by id)
 */
export async function getSessionById(
  sessionId: string,
): Promise<ChatSession | null> {
  return await prisma.chatSession.findUnique({
    where: { id: sessionId },
  })
}

/**
 * Phase 8c: 세션 조회 (by Dify conversation_id)
 */
export async function getSessionByDifyConversationId(
  appId: string,
  difyConversationId: string,
  activeOnly = false,
): Promise<ChatSession | null> {
  return await prisma.chatSession.findFirst({
    where: {
      appId,
      difyConversationId,
      ...(activeOnly ? { isActive: true } : {}),
    },
  })
}

/**
 * Phase 8c-3: 앱+사용자별 세션 목록 조회 (conversations API 머지용)
 * isActive 필터 없이 전체 조회 → 삭제된 대화를 Dify 목록에서 필터링하기 위해
 */
export async function getSessionsByAppAndUser(
  appId: string,
  userId?: string,
  anonymousSessionId?: string,
): Promise<ChatSession[]> {
  return await prisma.chatSession.findMany({
    where: {
      appId,
      ...(userId
        ? { userId, isAnonymous: false }
        : anonymousSessionId
          ? { sessionId: anonymousSessionId, isAnonymous: true }
          : {}),
    },
  })
}
