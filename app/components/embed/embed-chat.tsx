'use client'

import { useState, useEffect } from 'react'
import { FloatingButton } from './floating-button'
import { ChatPopup } from './chat-popup'
import Main from '@/app/components'
import type { AppConfig } from '@/hooks/use-app'

interface EmbedChatProps {
  appId: string
  app: AppConfig
}

export function EmbedChat({ appId, app }: EmbedChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // 부모 창과 postMessage 통신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: origin 검증 (프로덕션에서는 특정 도메인만 허용)
      // if (event.origin !== 'https://trusted-domain.com') return

      const { type, data } = event.data

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
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'CHAT_STATUS',
          data: { isOpen, unreadCount },
        },
        '*', // 프로덕션에서는 특정 origin 지정
      )
    }
  }, [isOpen, unreadCount])

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
        <Main params={{}} appId={appId} />
      </ChatPopup>
    </>
  )
}
