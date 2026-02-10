'use client'

import { useState } from 'react'

interface FloatingButtonProps {
  onClick: () => void
  unreadCount?: number
  iconUrl?: string
  appName?: string
}

export function FloatingButton({ onClick, unreadCount = 0, iconUrl, appName }: FloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group overflow-hidden"
        aria-label="Open chat"
      >
        {/* 아이콘 */}
        <img
          src={iconUrl || '/icons/chat_floating_button.svg'}
          alt={appName || 'Chat'}
          className="w-full h-full object-cover scale-[1.25]"
        />

        {/* 읽지 않은 메시지 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* 툴팁 */}
        {isHovered && appName && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
            {appName}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </button>
    </div>
  )
}
