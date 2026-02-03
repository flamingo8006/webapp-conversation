'use client'

import type { ReactNode } from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'

interface ChatPopupProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  appName?: string
}

const MIN_WIDTH = 320
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 900
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 600
const STORAGE_KEY = 'embed-chat-size'

export function ChatPopup({ isOpen, onClose, children, appName }: ChatPopupProps) {
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [isResizing, setIsResizing] = useState(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startSizeRef = useRef({ width: 0, height: 0 })

  // localStorage에서 저장된 크기 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSize({
          width: Math.min(Math.max(parsed.width || DEFAULT_WIDTH, MIN_WIDTH), MAX_WIDTH),
          height: Math.min(Math.max(parsed.height || DEFAULT_HEIGHT, MIN_HEIGHT), MAX_HEIGHT),
        })
      }
    }
    catch (e) {
      // 무시
    }
  }, [])

  // 크기 변경 시 localStorage에 저장 및 부모 창에 알림
  useEffect(() => {
    if (!isResizing) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
        // 부모 창(임베드 HTML)에 리사이즈 메시지 전송
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'CHATBOT_RESIZE',
            width: size.width,
            height: size.height,
          }, '*')
        }
      }
      catch (e) {
        // 무시
      }
    }
  }, [size, isResizing])

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    startPosRef.current = { x: clientX, y: clientY }
    startSizeRef.current = { ...size }
  }, [size])

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    // 왼쪽 위로 드래그하면 크기가 커짐 (팝업이 오른쪽 아래에 고정되어 있으므로)
    const deltaX = startPosRef.current.x - clientX
    const deltaY = startPosRef.current.y - clientY

    const newWidth = Math.min(Math.max(startSizeRef.current.width + deltaX, MIN_WIDTH), MAX_WIDTH)
    const newHeight = Math.min(Math.max(startSizeRef.current.height + deltaY, MIN_HEIGHT), MAX_HEIGHT)

    setSize({ width: newWidth, height: newHeight })
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // 마우스/터치 이벤트 리스너
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.addEventListener('touchmove', handleResizeMove)
      document.addEventListener('touchend', handleResizeEnd)

      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.removeEventListener('touchmove', handleResizeMove)
        document.removeEventListener('touchend', handleResizeEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden relative"
        style={{ width: `${size.width}px`, height: `${size.height}px` }}
      >
        {/* 리사이즈 핸들 (왼쪽 상단 모서리) */}
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10 group"
          title="드래그하여 크기 조절"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M2 2h4v2H4v2H2V2zm0 6h2v2h2v2H2V8z" />
          </svg>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <h3 className="font-semibold truncate pl-2">
            {appName || 'Chat'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 채팅 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
