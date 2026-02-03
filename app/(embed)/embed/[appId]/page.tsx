'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AppProvider } from '@/app/components/providers/app-provider'
import { EmbedChat } from '@/app/components/embed/embed-chat'
import type { AppConfig } from '@/hooks/use-app'

export default function EmbedPage() {
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()
  const appId = params.appId as string
  const token = searchParams.get('token')

  const [app, setApp] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError(t('app.embed.tokenRequired'))
      setLoading(false)
      return
    }

    fetchApp()
  }, [appId, token])

  const fetchApp = async () => {
    try {
      // 토큰은 이미 URL에서 middleware가 처리함
      const response = await fetch(`/api/admin/apps/${appId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch app')
      }

      const data = await response.json()
      setApp(data)
    }
    catch (err) {
      console.error('Failed to fetch app:', err)
      setError(t('app.chatbot.loadError'))
    }
    finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">
            {t('app.embed.contactAdmin')}
          </p>
        </div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <AppProvider initialApp={app}>
      <EmbedChat appId={appId} app={app} />
    </AppProvider>
  )
}
