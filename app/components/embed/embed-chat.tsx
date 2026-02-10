'use client'

import { useState, useEffect } from 'react'
import { FloatingButton } from './floating-button'
import { ChatPopup } from './chat-popup'
import SimpleChatMain from '@/app/components/simple-chat-main'
import type { AppConfig } from '@/hooks/use-app'

interface EmbedChatProps {
  appId: string
  app: AppConfig
}

export function EmbedChat({ appId, app }: EmbedChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // 허용된 origin 목록 (환경변수로 관리)
  const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_EMBED_ORIGINS
    ? process.env.NEXT_PUBLIC_ALLOWED_EMBED_ORIGINS.split(',').map(o => o.trim())
    : []

  // 부모 창과 postMessage 통신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: origin 검증 (설정된 경우만 체크, 미설정 시 모든 origin 허용)
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) { return }

      const { type } = event.data || {}

      switch (type) {
        case 'OPEN_CHAT':
          setIsOpen(true)
          break
        case 'CLOSE_CHAT':
          setIsOpen(false)
          break
        case 'TOGGLE_CHAT':
          setIsOpen(prev => !prev)
          break
        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 채팅 상태를 부모 창에 전달
  const postMessageOrigin = allowedOrigins.length > 0 ? allowedOrigins[0] : '*'
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'CHAT_STATUS',
          data: { isOpen, unreadCount },
        },
        postMessageOrigin,
      )
    }
  }, [isOpen, unreadCount, postMessageOrigin])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    if (!isOpen) {
      setUnreadCount(0) // 열 때 읽지 않은 메시지 초기화
    }
  }

  return (
    <>
      <FloatingButton
        onClick={handleToggle}
        unreadCount={unreadCount}
        iconUrl={app.iconUrl || undefined}
        appName={app.name}
      />

      <ChatPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appName={app.name}
      >
        <SimpleChatMain appId={appId} />
      </ChatPopup>
    </>
  )
}
