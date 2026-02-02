/**
 * Edge Runtime 안전한 챗봇 앱 조회
 * 미들웨어에서 사용 (암호화 모듈 없이)
 */

import { prisma } from '@/lib/prisma'
import type { ChatbotApp } from '@prisma/client'

export interface ChatbotAppPublicEdge {
  id: string
  name: string
  description: string | null
  difyAppId: string
  apiUrl: string
  iconUrl: string | null
  isActive: boolean
  sortOrder: number
  isPublic: boolean
  requireAuth: boolean
  allowAnonymous: boolean
  maxAnonymousMsgs: number | null
  createdAt: Date
}

/**
 * 챗봇 앱 조회 (API Key 제외, Edge Runtime 안전)
 */
export async function getChatbotAppByIdEdge(id: string): Promise<ChatbotAppPublicEdge | null> {
  const app = await prisma.chatbotApp.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      difyAppId: true,
      apiUrl: true,
      iconUrl: true,
      isActive: true,
      sortOrder: true,
      isPublic: true,
      requireAuth: true,
      allowAnonymous: true,
      maxAnonymousMsgs: true,
      createdAt: true,
    },
  })

  return app
}
