import type { ChatbotApp } from '@prisma/client'
import { decrypt, encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// 클라이언트에 노출되는 타입 (apiKey 제외)
export interface ChatbotAppPublic {
  id: string
  name: string
  description: string | null
  // 다국어 필드 (Phase 8a-2)
  nameKo: string | null
  nameEn: string | null
  descriptionKo: string | null
  descriptionEn: string | null
  difyAppId: string
  apiUrl: string
  iconUrl: string | null
  isActive: boolean
  sortOrder: number
  isPublic: boolean // 공개 챗봇 여부
  requireAuth: boolean // 인증 필수 여부
  allowAnonymous: boolean // 익명 사용자 허용
  maxAnonymousMsgs: number | null // 익명 사용자 최대 메시지 수
  createdAt: Date
  createdBy: string | null // 생성자 ID (Phase 8b - 권한 관리)
}

// 서버 내부용 타입 (복호화된 apiKey 포함)
export interface ChatbotAppWithKey extends ChatbotAppPublic {
  apiKey: string
}

/**
 * 챗봇 앱 생성 (API Key 암호화 저장)
 */
export async function createChatbotApp(data: {
  name: string
  description?: string
  nameKo?: string
  nameEn?: string
  descriptionKo?: string
  descriptionEn?: string
  difyAppId: string
  apiKey: string
  apiUrl?: string
  iconUrl?: string
  isPublic?: boolean
  requireAuth?: boolean
  allowAnonymous?: boolean
  maxAnonymousMsgs?: number
  createdBy?: string
}): Promise<ChatbotAppPublic> {
  const encryptedApiKey = encrypt(data.apiKey)

  const app = await prisma.chatbotApp.create({
    data: {
      name: data.name,
      description: data.description,
      nameKo: data.nameKo,
      nameEn: data.nameEn,
      descriptionKo: data.descriptionKo,
      descriptionEn: data.descriptionEn,
      difyAppId: data.difyAppId,
      apiKeyEncrypted: encryptedApiKey,
      apiUrl: data.apiUrl || 'https://api.dify.ai/v1',
      iconUrl: data.iconUrl,
      isPublic: data.isPublic ?? false,
      requireAuth: data.requireAuth ?? true,
      allowAnonymous: data.allowAnonymous ?? false,
      maxAnonymousMsgs: data.maxAnonymousMsgs,
      createdBy: data.createdBy,
    },
  })

  return toPublic(app)
}

/**
 * 챗봇 앱 수정 (API Key 변경 시 재암호화)
 */
export async function updateChatbotApp(
  id: string,
  data: {
    name?: string
    description?: string
    nameKo?: string
    nameEn?: string
    descriptionKo?: string
    descriptionEn?: string
    difyAppId?: string
    apiKey?: string // 새 API Key (있는 경우에만 업데이트)
    apiUrl?: string
    iconUrl?: string
    isActive?: boolean
    sortOrder?: number
    isPublic?: boolean
    requireAuth?: boolean
    allowAnonymous?: boolean
    maxAnonymousMsgs?: number
    updatedBy?: string
  },
): Promise<ChatbotAppPublic> {
  const updateData: any = { ...data }
  delete updateData.apiKey

  // API Key가 제공된 경우에만 암호화하여 업데이트
  if (data.apiKey) {
    updateData.apiKeyEncrypted = encrypt(data.apiKey)
  }

  const app = await prisma.chatbotApp.update({
    where: { id },
    data: updateData,
  })

  return toPublic(app)
}

/**
 * 챗봇 앱 조회 (API Key 제외 - 관리자/클라이언트)
 */
export async function getChatbotAppById(id: string): Promise<ChatbotAppPublic | null> {
  const app = await prisma.chatbotApp.findUnique({
    where: { id, isActive: true },
  })

  if (!app)
  { return null }

  return toPublic(app)
}

/**
 * 챗봇 앱 조회 (복호화된 API Key 포함 - 서버 전용)
 */
export async function getChatbotAppWithKey(id: string): Promise<ChatbotAppWithKey | null> {
  const app = await prisma.chatbotApp.findUnique({
    where: { id, isActive: true },
  })

  if (!app)
  { return null }

  return {
    ...toPublic(app),
    apiKey: decrypt(app.apiKeyEncrypted),
  }
}

/**
 * 챗봇 앱 목록 조회 (API Key 제외 - 클라이언트 안전)
 * @param createdBy - 특정 관리자가 생성한 챗봇만 조회 (null이면 전체)
 */
export async function listChatbotApps(createdBy?: string | null): Promise<ChatbotAppPublic[]> {
  const apps = await prisma.chatbotApp.findMany({
    where: {
      isActive: true,
      ...(createdBy ? { createdBy } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return apps.map(toPublic)
}

/**
 * 공개 챗봇 목록 조회 (인증 없이 접근 가능한 챗봇)
 */
export async function listPublicChatbotApps(): Promise<ChatbotAppPublic[]> {
  const apps = await prisma.chatbotApp.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return apps.map(toPublic)
}

/**
 * 챗봇 앱 삭제 (소프트 삭제)
 */
export async function deleteChatbotApp(id: string, deletedBy?: string): Promise<void> {
  await prisma.chatbotApp.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deletedBy,
    },
  })
}

/**
 * DB 엔티티를 공개용 타입으로 변환 (apiKey 제외)
 */
function toPublic(app: ChatbotApp): ChatbotAppPublic {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    nameKo: app.nameKo,
    nameEn: app.nameEn,
    descriptionKo: app.descriptionKo,
    descriptionEn: app.descriptionEn,
    difyAppId: app.difyAppId,
    apiUrl: app.apiUrl,
    iconUrl: app.iconUrl,
    isActive: app.isActive,
    sortOrder: app.sortOrder,
    isPublic: app.isPublic,
    requireAuth: app.requireAuth,
    allowAnonymous: app.allowAnonymous,
    maxAnonymousMsgs: app.maxAnonymousMsgs,
    createdAt: app.createdAt,
    createdBy: app.createdBy,
  }
}
