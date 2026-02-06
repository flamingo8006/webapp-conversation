'use client'

import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, PenSquare, MessageSquare, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/app/components/language-switcher'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  showBackButton?: boolean
  onBack?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  showBackButton,
  onBack,
}) => {
  const { t } = useTranslation()

  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-background border-b">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {isMobile && !showBackButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onShowSideBar?.()}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('app.sidebar.openSidebar') || 'Open sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {!isMobile && <div className="w-8" />}
      </div>

      {/* Center Section - Logo and Title */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-sm text-foreground font-semibold">{title}</div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher variant="compact" className="h-8 w-8" />

        {isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onCreateNewChat?.()}
                >
                  <PenSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('app.chat.newChat')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!isMobile && <div className="w-8" />}
      </div>
    </div>
  )
}

export default React.memo(Header)
