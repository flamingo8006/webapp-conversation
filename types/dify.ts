/**
 * Dify API 응답 타입 정의 (Phase 10-3)
 * dify-client SDK의 응답 구조를 타입으로 정의
 */

export interface DifyConversation {
  id: string
  name: string
  inputs: Record<string, unknown>
  status: string
  introduction: string
  created_at: number
  updated_at: number
}

export interface DifyConversationsResponse {
  data: DifyConversation[]
  has_more: boolean
  limit: number
}

export interface DifyMessageFile {
  id: string
  type: string
  url: string
  belongs_to: string
}

export interface DifyMessage {
  id: string
  conversation_id: string
  inputs: Record<string, unknown>
  query: string
  answer: string
  message_files: DifyMessageFile[]
  feedback: { rating: string } | null
  retriever_resources: unknown[]
  created_at: number
}

export interface DifyMessagesResponse {
  data: DifyMessage[]
  has_more: boolean
  limit: number
}
