'use client'

import type { FC } from 'react'
import React, { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import ExampleQuestions from '../example-questions'

export interface IWelcomeScreenProps {
  userName?: string
  onSend: (message: string, files?: VisionFile[]) => void
  isResponding?: boolean
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  suggestedQuestions?: string[]
}

const WelcomeScreen: FC<IWelcomeScreenProps> = ({
  userName,
  onSend,
  isResponding = false,
  visionConfig,
  fileConfig,
  suggestedQuestions = [],
}) => {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const handleSend = () => {
    if (!query.trim()) {
      return
    }

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
      if (files.length) {
        onClear()
      }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) {
      setAttachmentFiles([])
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current) {
        handleSend()
      }
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

  const handleExampleClick = (question: string) => {
    setQuery(question)
    queryRef.current = question
    // Focus on textarea and send after brief delay
    textareaRef.current?.focus()
    setTimeout(() => {
      onSend(question, [])
    }, 100)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [query])

  // Only show examples if suggestedQuestions are provided from Dify
  const examples = suggestedQuestions

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Logo and Welcome Message */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('app.welcome.title', { userName: userName || 'Guest' })}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {t('app.welcome.subtitle')}
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl mb-6">
        <Card className="p-3 shadow-lg border-2 hover:border-primary/50 transition-colors">
          <div className="relative">
            {visionConfig?.enabled && (
              <>
                <div className="absolute bottom-2 left-2 flex items-center z-10">
                  <ChatImageUploader
                    settings={visionConfig}
                    onUpload={onUpload}
                    disabled={files.length >= visionConfig.number_limits}
                  />
                  <div className="mx-1 w-[1px] h-4 bg-border" />
                </div>
                <div className="pl-[52px]">
                  <ImageList
                    list={files}
                    onRemove={onRemove}
                    onReUpload={onReUpload}
                    onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                    onImageLinkLoadError={onImageLinkLoadError}
                  />
                </div>
              </>
            )}
            {fileConfig?.enabled && (
              <div className={cn(visionConfig?.enabled && 'pl-[52px]', 'mb-1')}>
                <FileUploaderInAttachmentWrapper
                  fileConfig={fileConfig}
                  value={attachmentFiles}
                  onChange={setAttachmentFiles}
                />
              </div>
            )}
            <Textarea
              ref={textareaRef}
              className={cn(
                'min-h-[52px] max-h-[150px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-[100px] py-3 text-base',
                visionConfig?.enabled && 'pl-12',
              )}
              value={query}
              onChange={handleContentChange}
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              placeholder={t('app.welcome.inputPlaceholder')}
              rows={1}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="h-5 leading-5 text-sm bg-muted text-muted-foreground px-2 rounded">
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
                        'w-9 h-9 rounded-lg',
                        query.trim() && !isResponding
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg'
                          : '',
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('common.operation.send')} Enter</p>
                    <p>{t('common.operation.lineBreak')} Shift+Enter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </Card>
      </div>

      {/* Example Questions - Only show if Dify provides suggested questions */}
      {examples.length > 0 && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t('app.welcome.examplesTitle')}</span>
          </div>
          <ExampleQuestions
            questions={examples}
            onQuestionClick={handleExampleClick}
          />
        </div>
      )}
    </div>
  )
}

export default React.memo(WelcomeScreen)
