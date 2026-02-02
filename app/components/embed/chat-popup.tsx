'use client'

import type { ReactNode } from 'react'

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  appName?: string
}

export function ChatPopup({ isOpen, onClose, children, appName }: ChatPopupProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-[400px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <h3 className="font-semibold truncate">
            {appName || 'Chat'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 채팅 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
