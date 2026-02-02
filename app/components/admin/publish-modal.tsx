'use client'

import { useState } from 'react'
import type { AppConfig } from '@/hooks/use-app'
import { EmbedCodeModal } from './embed-code-modal'

interface PublishModalProps {
  app: AppConfig
  isOpen: boolean
  onClose: () => void
}

type ViewType = 'main' | 'run-app'

export function PublishModal({ app, isOpen, onClose }: PublishModalProps) {
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('main')

  if (!isOpen)
    return null

  const handleRunApp = () => {
    setViewType('run-app')
  }

  const handleSimpleChat = () => {
    window.open(`/simple-chat/${app.id}`, '_blank')
    onClose()
  }

  const handleAppChat = () => {
    window.open(`/chat/${app.id}`, '_blank')
    onClose()
  }

  const handleEmbed = () => {
    setShowEmbedModal(true)
  }

  const handleEmbedModalClose = () => {
    setShowEmbedModal(false)
    onClose()
  }

  const handleBack = () => {
    setViewType('main')
  }

  const handleModalClose = () => {
    setViewType('main')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleModalClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {viewType === 'run-app' && (
                <button
                  onClick={handleBack}
                  className="mr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {viewType === 'main' ? `${app.name} 게시하기` : '앱 실행 방식 선택'}
              </h3>
            </div>
            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main View */}
          {viewType === 'main' && (
            <div className="space-y-3">
              <button
                onClick={handleRunApp}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">앱 실행</p>
                    <p className="text-sm text-gray-500">새 창에서 챗봇을 실행합니다</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleEmbed}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">사이트에 삽입</p>
                    <p className="text-sm text-gray-500">웹사이트에 임베드 코드를 삽입합니다</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Run App View */}
          {viewType === 'run-app' && (
            <div className="space-y-3">
              <button
                onClick={handleSimpleChat}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">샘플형</p>
                    <p className="text-sm text-gray-500">깔끔하고 세련된 단순 채팅 화면</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleAppChat}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">앱형</p>
                    <p className="text-sm text-gray-500">대화 히스토리와 다양한 기능 포함</p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embed Code Modal */}
      <EmbedCodeModal
        app={app}
        isOpen={showEmbedModal}
        onClose={handleEmbedModalClose}
      />
    </>
  )
}
