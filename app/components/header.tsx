import type { FC } from 'react'
import React from 'react'
import { Menu, PenSquare, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-muted/50 border-b">
      {isMobile
        ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onShowSideBar?.()}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )
        : <div></div>}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="text-sm text-foreground font-bold">{title}</div>
      </div>
      {isMobile
        ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCreateNewChat?.()}
          >
            <PenSquare className="h-4 w-4" />
          </Button>
        )
        : <div></div>}
    </div>
  )
}

export default React.memo(Header)
