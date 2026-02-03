'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AppConfig } from '@/hooks/use-app'
import { ChatTypeModal } from './chat-type-modal'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AppCardProps {
  app: AppConfig
}

export function AppCard({ app }: AppCardProps) {
  const { t, i18n } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Phase 8a-2: 현재 언어에 맞는 이름/설명 표시
  const currentLang = i18n.language

  const displayName = currentLang === 'ko'
    ? (app.nameKo || app.name)
    : (app.nameEn || app.nameKo || app.name)

  const displayDesc = currentLang === 'ko'
    ? (app.descriptionKo || app.description)
    : (app.descriptionEn || app.descriptionKo || app.description)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <Card
      onClick={handleClick}
      className="hover:shadow-lg transition-shadow cursor-pointer"
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* 아이콘 */}
          <div className="flex-shrink-0">
            {app.iconUrl ? (
              <img
                src={app.iconUrl}
                alt={displayName}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
              {displayName}
            </h3>
            {displayDesc && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {displayDesc}
              </p>
            )}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="link"
            className="p-0 h-auto text-primary"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            {t('app.portal.startChat')}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* 채팅 타입 선택 모달 */}
      <ChatTypeModal
        app={app}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  )
}
