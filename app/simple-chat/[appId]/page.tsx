'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AppProvider } from '@/app/components/providers/app-provider'
import type { AppConfig } from '@/hooks/use-app'
import SimpleChatMain from '@/app/components/simple-chat-main'
import Toast from '@/app/components/base/toast'

export default function SimpleChatPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

  const [app, setApp] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 페이지 마운트 시 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    fetchApp()
  }, [appId])

  const fetchApp = async () => {
    try {
      // Phase 7: 공개 API 사용 (익명 접근 가능)
      const response = await fetch(`/api/apps/${appId}/info`)

      if (!response.ok) {
        if (response.status === 404) {
          setError(t('app.chatbot.notFound'))
          return
        }
        if (response.status === 403) {
          setError(t('app.chatbot.private'))
          return
        }
        throw new Error('Failed to fetch app')
      }

      const data = await response.json()
      setApp(data)
    }
    catch (error) {
      console.error('Failed to fetch app:', error)
      setError(t('app.chatbot.loadError'))
    }
    finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('app.chatbot.errorTitle')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('app.chatbot.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <AppProvider initialApp={app}>
      <SimpleChatMain params={{}} appId={appId} appName={app.name} />
    </AppProvider>
  )
}
