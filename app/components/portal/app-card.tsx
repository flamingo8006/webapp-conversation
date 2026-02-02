'use client'

import { useState } from 'react'
import type { AppConfig } from '@/hooks/use-app'
import { ChatTypeModal } from './chat-type-modal'

interface AppCardProps {
  app: AppConfig
}

export function AppCard({ app }: AppCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer p-6 border border-gray-200"
    >
      <div className="flex items-start space-x-4">
        {/* 아이콘 */}
        <div className="flex-shrink-0">
          {app.iconUrl ? (
            <img
              src={app.iconUrl}
              alt={app.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {app.name}
          </h3>
          {app.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {app.description}
            </p>
          )}
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          채팅 시작 →
        </button>
      </div>

      {/* 채팅 타입 선택 모달 */}
      <ChatTypeModal
        app={app}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
