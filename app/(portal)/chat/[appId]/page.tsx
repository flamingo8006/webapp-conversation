'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AppProvider } from '@/app/components/providers/app-provider'
import type { AppConfig } from '@/hooks/use-app'
import Main from '@/app/components'
import Toast from '@/app/components/base/toast'

export default function ChatPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

  const [app, setApp] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApp()
  }, [appId])

  const fetchApp = async () => {
    try {
      // Phase 7: 공개 API 사용 (익명 접근 가능)
      const response = await fetch(`/api/apps/${appId}/info`)

      if (!response.ok) {
        if (response.status === 404) {
          Toast.notify({
            type: 'error',
            message: t('app.chatbot.notFound'),
          })
          router.push('/')
          return
        }
        if (response.status === 403) {
          Toast.notify({
            type: 'error',
            message: t('app.chatbot.private'),
          })
          router.push('/')
          return
        }
        throw new Error('Failed to fetch app')
      }

      const data = await response.json()
      setApp(data)
    }
    catch (error) {
      console.error('Failed to fetch app:', error)
      Toast.notify({
        type: 'error',
        message: t('app.chatbot.loadError'),
      })
      router.push('/')
    }
    finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <AppProvider initialApp={app}>
      <Main params={{}} appId={appId} />
    </AppProvider>
  )
}
