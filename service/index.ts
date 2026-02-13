import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { get, post, ssePost } from './base'
import type { Feedbacktype } from '@/types/app'

export const sendChatMessage = async (
  appId: string,
  body: Record<string, any>,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  return ssePost(`apps/${appId}/chat-messages`, {
    body: {
      ...body,
      response_mode: 'streaming',
    },
  }, { onData, onCompleted, onThought, onFile, onError, getAbortController, onMessageEnd, onMessageReplace, onNodeStarted, onWorkflowStarted, onWorkflowFinished, onNodeFinished })
}

export const fetchConversations = async (appId: string) => {
  return get(`apps/${appId}/conversations`, { params: { limit: 100, first_id: '' } })
}

export const fetchChatList = async (appId: string, conversationId: string) => {
  return get(`apps/${appId}/messages`, { params: { conversation_id: conversationId, limit: 20, last_id: '' } })
}

// init value. wait for server update
export const fetchAppParams = async (appId: string) => {
  return get(`apps/${appId}/parameters`)
}

export const updateFeedback = async ({ url, body }: { url: string, body: Feedbacktype }) => {
  return post(url, { body })
}

// 세션 조회 또는 생성
export const createOrGetSession = async (appId: string, difyConversationId?: string) => {
  return post(`apps/${appId}/sessions`, {
    body: {
      action: 'create_or_get_session',
      difyConversationId,
    },
  })
}

// 메시지 저장
export const saveMessageToDB = async (appId: string, message: {
  sessionId: string
  difyMessageId?: string
  role: 'user' | 'assistant'
  content: string
  files?: any
  tokenCount?: number
}) => {
  return post(`apps/${appId}/sessions`, {
    body: {
      action: 'save_message',
      message,
    },
  })
}

// 사용자 세션 목록 조회
export const fetchUserSessions = async (appId: string) => {
  return get(`apps/${appId}/sessions`)
}
