'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, AlertCircle } from 'lucide-react'
import Answer from './chat/answer'
import Question from './chat/question'
import type { FeedbackFunc } from './chat/type'
import s from './chat/style.module.css'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ISimpleChatProps {
  chatList: ChatItem[]
  feedbackDisabled?: boolean
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  suggestedQuestions?: string[]
  showWorkflowSteps?: boolean
}

const SimpleChat: FC<ISimpleChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  suggestedQuestions = [],
  showWorkflowSteps = false,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const isInitialLoad = useRef(true)

  // 자동 스크롤
  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'instant' : 'smooth',
    })
  }

  // 채팅 리스트 변경 시 스크롤
  useEffect(() => {
    if (chatList.length > 0) {
      // 초기 로드 시에는 즉시 스크롤 (애니메이션 없이)
      if (isInitialLoad.current) {
        // 약간의 딜레이 후 스크롤 (렌더링 완료 대기)
        setTimeout(() => {
          scrollToBottom(true)
          isInitialLoad.current = false
        }, 100)
      } else {
        // 새 메시지 시에는 부드러운 스크롤
        scrollToBottom(false)
      }
    }
  }, [chatList])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [query])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 채팅 메시지 리스트 */}
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 sm:space-y-6 pb-3 sm:pb-4">
          {chatList.map((item) => {
            // 오프닝 스테이트먼트 - Answer 컴포넌트와 동일한 스타일
            if (item.isOpeningStatement) {
              const displaySuggestions = item.suggestedQuestions?.length
                ? item.suggestedQuestions
                : suggestedQuestions
              return (
                <div key={item.id}>
                  <div className="flex items-start">
                    <div className={`${s.answerIcon} w-10 h-10 shrink-0`} />
                    <div className={`${s.answerWrap} max-w-[calc(100%-3rem)]`}>
                      <div className={`${s.answer} relative text-sm text-gray-900`}>
                        <div className="ml-2 py-3 px-4 bg-gray-100 rounded-tr-2xl rounded-b-2xl">
                          <p className="text-sm text-gray-900">
                            {item.content}
                          </p>
                          {/* Suggested Questions */}
                          {displaySuggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {displaySuggestions.slice(0, 4).map((question, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="h-auto py-1.5 px-3 text-xs text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors"
                                  onClick={() => suggestionClick(question)}
                                >
                                  {question}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            if (item.isAnswer) {
              const isLast = item.id === chatList[chatList.length - 1].id
              // 에러 메시지인 경우 특별 스타일 적용
              if (item.isError) {
                return (
                  <div key={item.id} className="flex justify-start mb-4">
                    <Alert variant="destructive" className="max-w-[85%]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{item.content}</AlertDescription>
                    </Alert>
                  </div>
                )
              }
              return (
                <Answer
                  key={item.id}
                  item={item}
                  feedbackDisabled={feedbackDisabled}
                  onFeedback={onFeedback}
                  isResponding={isResponding && isLast}
                  suggestionClick={suggestionClick}
                  showWorkflowSteps={showWorkflowSteps}
                />
              )
            }
            // 사용자 질문
            return (
              <Question
                key={item.id}
                id={item.id}
                content={item.content}
                useCurrentUserAvatar={useCurrentUserAvatar}
                imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
              />
            )
          })}
          {/* 스크롤 앵커 */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      {!isHideSendInput && (
        <div className="sticky bottom-0 pt-3 sm:pt-4 pb-2 bg-background border-t flex-shrink-0">
          <div className="relative w-full">
            <div className="bg-muted/50 border-2 border-input rounded-xl overflow-hidden focus-within:border-primary focus-within:bg-background transition-all">
              {
                visionConfig?.enabled && (
                  <>
                    <div className="absolute bottom-3 left-3 flex items-center z-10">
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className="mx-1 w-[1px] h-4 bg-border" />
                    </div>
                    {files.length > 0 && (
                      <div className="pl-[52px] pt-2">
                        <ImageList
                          list={files}
                          onRemove={onRemove}
                          onReUpload={onReUpload}
                          onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                          onImageLinkLoadError={onImageLinkLoadError}
                        />
                      </div>
                    )}
                  </>
                )
              }
              {
                fileConfig?.enabled && attachmentFiles.length > 0 && (
                  <div className={`${visionConfig?.enabled ? 'pl-[52px]' : 'pl-3'} pt-2`}>
                    <FileUploaderInAttachmentWrapper
                      fileConfig={fileConfig}
                      value={attachmentFiles}
                      onChange={setAttachmentFiles}
                    />
                  </div>
                )
              }
              <Textarea
                ref={textareaRef}
                className={cn(
                  'min-h-[44px] max-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 pt-2.5 pb-3 pr-20 sm:pr-24 text-sm',
                  visionConfig?.enabled ? 'pl-12 sm:pl-14' : 'pl-3 sm:pl-4',
                )}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                placeholder={t('app.chat.inputPlaceholder')}
                rows={1}
                autoFocus
              />
              <div className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-3 flex items-center gap-1.5 sm:gap-2">
                <span className="h-5 sm:h-6 leading-5 sm:leading-6 text-[10px] sm:text-xs bg-muted text-muted-foreground px-1.5 sm:px-2 rounded">
                  {query.trim().length}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!query.trim() || isResponding}
                        className={cn(
                          'w-7 h-7 sm:w-8 sm:h-8 rounded-lg',
                          query.trim() && !isResponding
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                            : '',
                        )}
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('app.chat.sendHint')}</p>
                      <p>{t('app.chat.newlineHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2 pb-1">
            {t('app.chat.disclaimer')}
          </p>
        </div>
      )}
    </div>
  )
}

export default React.memo(SimpleChat)
