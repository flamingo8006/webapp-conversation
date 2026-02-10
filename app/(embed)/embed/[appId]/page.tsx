'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AppProvider } from '@/app/components/providers/app-provider'
import { EmbedChat } from '@/app/components/embed/embed-chat'
import type { AppConfig } from '@/hooks/use-app'

type AuthMode = 'token' | 'hmac' | 'anonymous' | 'authenticated'

export default function EmbedPage() {
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()
  const appId = params.appId as string

  const [app, setApp] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detectAuthMode = useCallback((): AuthMode => {
    if (searchParams.get('sig'))
    { return 'hmac' }
    if (searchParams.get('token'))
    { return 'token' }
    // 쿠키는 클라이언트에서 직접 확인 불가 (httpOnly), 서버에서 처리
    return 'anonymous'
  }, [searchParams])

  const verifyHmac = useCallback(async () => {
    const loginId = searchParams.get('loginId')
    const empNo = searchParams.get('empNo')
    const name = searchParams.get('name')
    const ts = searchParams.get('ts')
    const sig = searchParams.get('sig')

    const response = await fetch('/api/auth/embed-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, empNo, name, ts, sig }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'HMAC verification failed')
    }

    return response.json()
  }, [searchParams])

  const fetchApp = useCallback(async () => {
    const response = await fetch(`/api/apps/${appId}/info`)

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to fetch app')
    }

    return response.json()
  }, [appId])

  useEffect(() => {
    const init = async () => {
      try {
        const authMode = detectAuthMode()

        // HMAC 모드: 먼저 서명 검증 → JWT 발급 → 쿠키 설정
        if (authMode === 'hmac') {
          await verifyHmac()
        }

        // token 모드: middleware에서 이미 쿠키 설정됨

        // 앱 정보 로드
        const appData = await fetchApp()
        setApp(appData)
      }
      catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'This chatbot is not public') {
          setError(t('app.chatbot.private'))
        }
        else if (message.includes('signature') || message.includes('verification') || message.includes('expired')) {
          setError(t('app.embed.authFailed'))
        }
        else {
          setError(t('app.chatbot.loadError'))
        }
      }
      finally {
        setLoading(false)
      }
    }

    init()
  }, [appId, detectAuthMode, verifyHmac, fetchApp, t])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-sm text-gray-500">{t('app.embed.verifying')}</p>
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
