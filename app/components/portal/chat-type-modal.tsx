'use client'

import { MessageSquare, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()

  // Phase 8a-2: 현재 언어에 맞는 앱 이름 표시
  const currentLang = i18n.language
  const displayName = currentLang === 'ko'
    ? (app.nameKo || app.name)
    : (app.nameEn || app.nameKo || app.name)

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
          <DialogTitle>{t('app.chatType.title')}</DialogTitle>
          <DialogDescription>
            {displayName}
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
                <p className="font-semibold text-foreground">{t('app.chatType.simple')}</p>
                <p className="text-sm text-muted-foreground">{t('app.chatType.simpleDesc')}</p>
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
                <p className="font-semibold text-foreground">{t('app.chatType.app')}</p>
                <p className="text-sm text-muted-foreground">{t('app.chatType.appDesc')}</p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
