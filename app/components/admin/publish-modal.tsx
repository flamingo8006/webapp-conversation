'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Code, MessageSquare, LayoutGrid } from 'lucide-react'
import type { AppConfig } from '@/hooks/use-app'
import { EmbedCodeModal } from './embed-code-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PublishModalProps {
  app: AppConfig
  isOpen: boolean
  onClose: () => void
}

type ViewType = 'main' | 'run-app'

export function PublishModal({ app, isOpen, onClose }: PublishModalProps) {
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('main')

  const handleRunApp = () => {
    setViewType('run-app')
  }

  const handleSimpleChat = () => {
    window.open(`/simple-chat/${app.id}`, '_blank')
    handleModalClose()
  }

  const handleAppChat = () => {
    window.open(`/chat/${app.id}`, '_blank')
    handleModalClose()
  }

  const handleEmbed = () => {
    setShowEmbedModal(true)
  }

  const handleEmbedModalClose = () => {
    setShowEmbedModal(false)
    handleModalClose()
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
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center">
              {viewType === 'run-app' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 h-8 w-8"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle>
                {viewType === 'main' ? `${app?.name} 게시하기` : '앱 실행 방식 선택'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Main View */}
          {viewType === 'main' && (
            <div className="space-y-3">
              <button
                onClick={handleRunApp}
                className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">앱 실행</p>
                    <p className="text-sm text-muted-foreground">새 창에서 챗봇을 실행합니다</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleEmbed}
                className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">사이트에 삽입</p>
                    <p className="text-sm text-muted-foreground">웹사이트에 임베드 코드를 삽입합니다</p>
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
                className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">샘플형</p>
                    <p className="text-sm text-muted-foreground">깔끔하고 세련된 단순 채팅 화면</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleAppChat}
                className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-4">
                    <LayoutGrid className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">앱형</p>
                    <p className="text-sm text-muted-foreground">대화 히스토리와 다양한 기능 포함</p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Embed Code Modal */}
      <EmbedCodeModal
        app={app}
        isOpen={showEmbedModal}
        onClose={handleEmbedModalClose}
      />
    </>
  )
}
