'use client'

import { MessageSquare, LayoutGrid } from 'lucide-react'
import type { AppConfig } from '@/hooks/use-app'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ChatTypeModalProps {
  app: AppConfig
  isOpen: boolean
  onClose: () => void
}

export function ChatTypeModal({ app, isOpen, onClose }: ChatTypeModalProps) {
  const handleSimpleChat = () => {
    window.open(`/simple-chat/${app.id}`, '_blank')
    onClose()
  }

  const handleAppChat = () => {
    window.open(`/chat/${app.id}`, '_blank')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>채팅 화면 선택</DialogTitle>
          <DialogDescription>
            {app.name} 챗봇을 어떤 화면으로 시작하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* 심플형 */}
          <button
            onClick={handleSimpleChat}
            className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">심플형</p>
                <p className="text-sm text-muted-foreground">깔끔하고 세련된 단순 채팅 화면</p>
              </div>
            </div>
          </button>

          {/* 앱형 */}
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
      </DialogContent>
    </Dialog>
  )
}
