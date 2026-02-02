'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './chat/style.module.css'
import Answer from './chat/answer'
import Question from './chat/question'
import type { FeedbackFunc } from './chat/type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

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
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatList])

  const handleContentChange = (e: any) => {
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
      // 이미 전송 후 초기화된 경우 오류 표시하지 않음
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

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-6 pb-3 sm:pb-4 simple-chat-messages">
        <style jsx>{`
          :global(.simple-chat-messages) {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          :global(.simple-chat-messages::-webkit-scrollbar) {
            width: 6px;
          }
          :global(.simple-chat-messages::-webkit-scrollbar-track) {
            background: transparent;
          }
          :global(.simple-chat-messages::-webkit-scrollbar-thumb) {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          :global(.simple-chat-messages::-webkit-scrollbar-thumb:hover) {
            background-color: rgba(156, 163, 175, 0.7);
          }
          /* 말풍선 반응형 */
          :global(.simple-chat-messages [class*="question"]),
          :global(.simple-chat-messages [class*="answer"]) {
            max-width: 100% !important;
            min-width: 0 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          /* 마크다운 콘텐츠 반응형 */
          :global(.simple-chat-messages pre),
          :global(.simple-chat-messages code),
          :global(.simple-chat-messages table) {
            max-width: 100% !important;
            overflow-x: auto !important;
          }
        `}</style>
        {chatList.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">
                무엇을 도와드릴까요?
              </p>
            </div>
          </div>
        ) : (
          chatList.map((item) => {
            if (item.isAnswer) {
              const isLast = item.id === chatList[chatList.length - 1].id
              // 에러 메시지인 경우 특별 스타일 적용
              if (item.isError) {
                return (
                  <div key={item.id} className="flex justify-start mb-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{item.content}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return <Answer
                key={item.id}
                item={item}
                feedbackDisabled={feedbackDisabled}
                onFeedback={onFeedback}
                isResponding={isResponding && isLast}
                suggestionClick={suggestionClick}
              />
            }
            return (
              <Question
                key={item.id}
                id={item.id}
                content={item.content}
                useCurrentUserAvatar={useCurrentUserAvatar}
                imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
              />
            )
          })
        )}
        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      {!isHideSendInput && (
        <div className='sticky bottom-0 pt-3 sm:pt-4 pb-2 bg-white border-t border-gray-100 flex-shrink-0'>
          <div className='relative w-full'>
            <div className='bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:bg-white transition-all'>
              {
                visionConfig?.enabled && (
                  <>
                    <div className='absolute bottom-3 left-3 flex items-center z-10'>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className='mx-1 w-[1px] h-4 bg-gray-300' />
                    </div>
                    <div className='pl-[52px] pt-2'>
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  </>
                )
              }
              {
                fileConfig?.enabled && (
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
                className={cn(
                  'block w-full py-2.5 sm:py-3 pr-20 sm:pr-24 leading-5 sm:leading-6 text-xs sm:text-sm text-gray-800 outline-none resize-none bg-transparent',
                  visionConfig?.enabled ? 'pl-12 sm:pl-14' : 'pl-3 sm:pl-4'
                )}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="메시지를 입력하세요..."
              />
              <div className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-3 flex items-center space-x-1.5 sm:space-x-2">
                <div className={`${s.count} h-5 sm:h-6 leading-5 sm:leading-6 text-[10px] sm:text-xs bg-gray-100 text-gray-500 px-1.5 sm:px-2 rounded`}>
                  {query.trim().length}
                </div>
                <Tooltip
                  selector='send-tip'
                  htmlContent={
                    <div className='text-xs'>
                      <div>전송: Enter</div>
                      <div>줄바꿈: Shift + Enter</div>
                    </div>
                  }
                >
                  <button
                    onClick={handleSend}
                    disabled={!query.trim() || isResponding}
                    className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                      query.trim() && !isResponding
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 cursor-not-allowed'
                    )}
                  >
                    <svg
                      className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', query.trim() && !isResponding ? 'text-white' : 'text-gray-400')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(SimpleChat)
