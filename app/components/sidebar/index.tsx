'use client'

import React, { useMemo, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, MoreHorizontal, PenSquare, Pin, PinOff, Pencil, Search, Trash2, X, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react'
import type { ConversationItem } from '@/types/app'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MAX_CONVERSATION_LENGTH = 20
const MAX_TITLE_LENGTH = 15

export interface ISidebarProps {
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
  onDeleteConversation?: (id: string) => void
  onRenameConversation?: (id: string, name: string) => void
  onPinConversation?: (id: string, isPinned: boolean) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  userName?: string
}

// Group conversations by date
function groupConversationsByDate(
  conversations: ConversationItem[],
  t: (key: string) => string,
) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const groups: { label: string, items: ConversationItem[], isPinnedGroup?: boolean }[] = []

  // Separate pinned and unpinned
  const pinnedItems = conversations.filter(item => item.isPinned && item.id !== '-1')
  const unpinnedItems = conversations.filter(item => !item.isPinned || item.id === '-1')

  // Add pinned group first
  if (pinnedItems.length > 0) {
    groups.push({
      label: t('app.sidebar.pinned'),
      items: pinnedItems.sort((a, b) => {
        const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
        const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
        return bTime - aTime
      }),
      isPinnedGroup: true,
    })
  }

  const todayItems: ConversationItem[] = []
  const yesterdayItems: ConversationItem[] = []
  const lastWeekItems: ConversationItem[] = []
  const lastMonthItems: ConversationItem[] = []
  const olderItems: ConversationItem[] = []

  unpinnedItems.forEach((item) => {
    if (item.id === '-1') {
      todayItems.push(item)
      return
    }
    const itemDate = new Date(item.updated_at || item.created_at || now)
    if (itemDate >= today) { todayItems.push(item) }
    else if (itemDate >= yesterday) { yesterdayItems.push(item) }
    else if (itemDate >= lastWeek) { lastWeekItems.push(item) }
    else if (itemDate >= lastMonth) { lastMonthItems.push(item) }
    else { olderItems.push(item) }
  })

  if (todayItems.length > 0) { groups.push({ label: t('app.sidebar.today'), items: todayItems }) }
  if (yesterdayItems.length > 0) { groups.push({ label: t('app.sidebar.yesterday'), items: yesterdayItems }) }
  if (lastWeekItems.length > 0) { groups.push({ label: t('app.sidebar.lastWeek'), items: lastWeekItems }) }
  if (lastMonthItems.length > 0) { groups.push({ label: t('app.sidebar.lastMonth'), items: lastMonthItems }) }
  if (olderItems.length > 0) { groups.push({ label: t('app.sidebar.older'), items: olderItems }) }

  return groups
}

const Sidebar: FC<ISidebarProps> = ({
  currentId,
  onCurrentIdChange,
  list,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  isCollapsed = false,
  onToggleCollapse,
  userName,
}) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<ConversationItem | null>(null)
  const [newName, setNewName] = useState('')

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) { return list }
    const query = searchQuery.toLowerCase()
    return list.filter(item =>
      (item.customTitle || item.name).toLowerCase().includes(query),
    )
  }, [list, searchQuery])

  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredList, t)
  }, [filteredList, t])

  const handleDelete = (id: string) => {
    if (onDeleteConversation) { onDeleteConversation(id) }
  }

  const handleRename = (item: ConversationItem) => {
    setRenameTarget(item)
    setNewName(item.customTitle || item.name)
    setRenameDialogOpen(true)
  }

  const handleRenameSubmit = () => {
    if (renameTarget && newName.trim() && onRenameConversation) {
      onRenameConversation(renameTarget.id, newName.trim())
    }
    setRenameDialogOpen(false)
    setRenameTarget(null)
    setNewName('')
  }

  const handlePin = (item: ConversationItem) => {
    if (onPinConversation) { onPinConversation(item.id, !item.isPinned) }
  }

  // 이슈 6: 띄어쓰기 포함 15자 초과 시 ... 처리
  const getDisplayName = (item: ConversationItem) => {
    const name = item.customTitle || item.name
    if (name.length > MAX_TITLE_LENGTH) {
      return `${name.slice(0, MAX_TITLE_LENGTH)}...`
    }
    return name
  }

  return (
    <div className={cn(
      'shrink-0 flex flex-col overflow-hidden bg-muted/30 border-r transition-all duration-300 h-full',
      isCollapsed ? 'w-[60px]' : 'w-[260px]',
    )}>
      {/* Header: Logo + Toggle */}
      <div className={cn(
        'flex flex-shrink-0 items-center h-12 px-3',
        isCollapsed ? 'justify-center' : 'justify-between',
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">DGIST AI</span>
          </div>
        )}
        {onToggleCollapse && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="h-8 w-8 flex-shrink-0"
                >
                  {isCollapsed
                    ? <PanelLeftOpen className="h-4 w-4" />
                    : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? 'right' : 'bottom'}>
                {isCollapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Menu Items */}
      <div className={cn('flex flex-col gap-0.5 mt-1', isCollapsed ? 'px-2' : 'px-3')}>
        {/* New Chat */}
        {list.length < MAX_CONVERSATION_LENGTH && (
          isCollapsed
            ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCurrentIdChange('-1')}
                      className="h-10 w-10 mx-auto"
                    >
                      <PenSquare className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('app.sidebar.newChat')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
            : (
              <Button
                variant="ghost"
                onClick={() => onCurrentIdChange('-1')}
                className="justify-start gap-3 h-10 text-foreground hover:bg-muted font-normal"
              >
                <PenSquare className="h-5 w-5 flex-shrink-0" />
                {t('app.sidebar.newChat')}
              </Button>
            )
        )}

        {/* Search */}
        {isCollapsed
          ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onToggleCollapse?.()
                      setTimeout(() => setShowSearch(true), 300)
                    }}
                    className="h-10 w-10 mx-auto"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('app.sidebar.search')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
          : (
            <Button
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'justify-start gap-3 h-10 hover:bg-muted font-normal',
                showSearch ? 'text-primary' : 'text-foreground',
              )}
            >
              <Search className="h-5 w-5 flex-shrink-0" />
              {t('app.sidebar.search')}
            </Button>
          )}
      </div>

      {/* 이슈 2: 접힌 상태에서는 대화내역 숨김 */}
      {isCollapsed
        ? (
          <div className="flex-1" />
        )
        : (
          <>
            {/* Search Input */}
            {showSearch && (
              <div className="px-3 pt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('app.sidebar.searchPlaceholder')}
                    className="pl-8 pr-8 h-9 bg-background"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                    onClick={() => { setShowSearch(false); setSearchQuery('') }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            )}

            {/* Section Header */}
            <div className="px-5 pt-4 pb-1">
              <span className="text-xs text-muted-foreground font-medium">
                {t('app.sidebar.myChats')}
              </span>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1 mt-1">
              <nav className="px-3 pb-3">
                {groupedConversations.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    {searchQuery ? t('app.sidebar.noResults') : t('app.sidebar.noConversations')}
                  </div>
                )}

                {groupedConversations.map((group, groupIndex) => (
                  <div key={group.label} className={cn(groupIndex > 0 && 'mt-3')}>
                    {/* Group Label (고정됨 그룹은 레이블 숨김) */}
                    {!group.isPinnedGroup && (
                      <div className="px-2 py-1 text-xs font-medium flex items-center gap-1 text-muted-foreground/70">
                        {group.label}
                      </div>
                    )}

                    {/* Group Items */}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isCurrent = item.id === currentId
                        const displayName = getDisplayName(item)

                        return (
                          <div
                            key={item.id}
                            onClick={() => onCurrentIdChange(item.id)}
                            className={cn(
                              'group flex items-center justify-between rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors',
                              isCurrent
                                ? 'bg-muted text-foreground'
                                : 'text-foreground/80 hover:bg-muted/60',
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {/* 이슈 4: 고정된 항목은 핀 아이콘 표시 */}
                              {item.isPinned && (
                                <Pin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                              )}
                              <span className="truncate" title={item.customTitle || item.name}>{displayName}</span>
                            </div>

                            {/* 이슈 3: 드롭다운 메뉴 - 선택 시 항상 표시, 호버 시 표시 */}
                            {item.id !== '-1' && (onDeleteConversation || onRenameConversation || onPinConversation) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      'h-7 w-7 flex-shrink-0 transition-opacity',
                                      isCurrent ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100',
                                      'hover:bg-muted-foreground/10',
                                    )}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40" onClick={e => e.stopPropagation()}>
                                  {onPinConversation && (
                                    <DropdownMenuItem onClick={() => handlePin(item)}>
                                      {item.isPinned
                                        ? (
                                          <><PinOff className="h-4 w-4 mr-2" />{t('app.sidebar.unpin')}</>
                                        )
                                        : (
                                          <><Pin className="h-4 w-4 mr-2" />{t('app.sidebar.pin')}</>
                                        )}
                                    </DropdownMenuItem>
                                  )}
                                  {onRenameConversation && (
                                    <DropdownMenuItem onClick={() => handleRename(item)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      {t('app.sidebar.rename')}
                                    </DropdownMenuItem>
                                  )}
                                  {(onPinConversation || onRenameConversation) && onDeleteConversation && (
                                    <DropdownMenuSeparator />
                                  )}
                                  {onDeleteConversation && (
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(item.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('common.operation.delete')}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </>
        )}

      {/* Footer: User Name */}
      <div className={cn(
        'flex flex-shrink-0 items-center p-3 border-t bg-background/50',
        isCollapsed ? 'justify-center' : 'gap-2.5',
      )}>
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        {!isCollapsed && (
          <span className="text-sm text-foreground truncate">
            {userName || t('app.portal.guestMode')}
          </span>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('app.sidebar.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('app.sidebar.renamePlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameSubmit() } }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t('common.operation.cancel')}
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!newName.trim()}>
              {t('common.operation.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default React.memo(Sidebar)
