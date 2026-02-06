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
        className="relative w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center group"
        aria-label="Open chat"
      >
        {/* 아이콘 */}
        {iconUrl
          ? (
            <img
              src={iconUrl}
              alt={appName || 'Chat'}
              className="w-10 h-10 rounded-full"
            />
          )
          : (
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          )}

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
