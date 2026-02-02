import React from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, PenSquare } from 'lucide-react'
import type { ConversationItem } from '@/types/app'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const MAX_CONVERSATION_LENTH = 20

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
}) => {
  const { t } = useTranslation()

  return (
    <div className="shrink-0 flex flex-col overflow-hidden bg-background pc:w-[244px] tablet:w-[192px] mobile:w-[240px] border-r tablet:h-[calc(100vh_-_3rem)] mobile:h-screen">
      {list.length < MAX_CONVERSATION_LENTH && (
        <div className="flex flex-shrink-0 p-4 pb-0">
          <Button
            variant="outline"
            onClick={() => { onCurrentIdChange('-1') }}
            className="w-full justify-start gap-2 h-9 text-primary"
          >
            <PenSquare className="h-4 w-4" />
            {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 mt-4">
        <nav className="space-y-1 px-4">
          {list.map((item) => {
            const isCurrent = item.id === currentId
            return (
              <div
                onClick={() => onCurrentIdChange(item.id)}
                key={item.id}
                className={cn(
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium cursor-pointer transition-colors',
                  isCurrent
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <MessageCircle
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isCurrent
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="flex flex-shrink-0 p-4 border-t">
        <div className="text-muted-foreground font-normal text-xs">
          © {copyRight} {(new Date()).getFullYear()}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Sidebar)
