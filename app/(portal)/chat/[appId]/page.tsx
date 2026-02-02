'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppProvider } from '@/app/components/providers/app-provider'
import type { AppConfig } from '@/hooks/use-app'
import Main from '@/app/components'
import Toast from '@/app/components/base/toast'

export default function ChatPage() {
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
      const response = await fetch(`/api/admin/apps/${appId}`)

      if (!response.ok) {
        if (response.status === 404) {
          Toast.notify({
            type: 'error',
            message: '챗봇을 찾을 수 없습니다.',
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
        message: '챗봇 정보를 불러오는데 실패했습니다.',
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
        <div className="text-gray-500">로딩 중...</div>
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
