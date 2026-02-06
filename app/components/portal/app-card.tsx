'use client'

import { MessageSquare, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AppConfig } from '@/hooks/use-app'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AppCardProps {
  app: AppConfig
}

export function AppCard({ app }: AppCardProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  // Phase 8a-2: 현재 언어에 맞는 이름/설명 표시
  const currentLang = i18n.language

  const displayName = currentLang === 'ko'
    ? (app.nameKo || app.name)
    : (app.nameEn || app.nameKo || app.name)

  const displayDesc = currentLang === 'ko'
    ? (app.descriptionKo || app.description)
    : (app.descriptionEn || app.descriptionKo || app.description)

  // Phase 9a: 익명 사용자는 심플형만, 인증 사용자는 선택 가능
  const isAnonymous = !user

  const handleSimpleChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/simple-chat/${app.id}`, '_blank')
  }

  const handleAppChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/chat/${app.id}`, '_blank')
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* 아이콘 */}
          <div className="flex-shrink-0">
            {app.iconUrl
              ? (
                <img
                  src={app.iconUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )
              : (
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

        {/* 하단 액션 - Phase 9a 변경: 카드 내 채팅 유형 선택 */}
        <div className="mt-4 pt-4 border-t">
          {isAnonymous
            ? (
              // 익명 사용자: 심플형만 사용 가능
              <Button
                variant="default"
                className="w-full"
                onClick={handleSimpleChat}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('app.portal.startChat')}
              </Button>
            )
            : (
              // 인증 사용자: 심플형/앱형 선택
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSimpleChat}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('app.chatType.simple')}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleAppChat}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  {t('app.chatType.app')}
                </Button>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
