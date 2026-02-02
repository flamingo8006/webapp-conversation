'use client'

import { useEffect, useState } from 'react'
import { AppCard } from './app-card'
import type { AppConfig } from '@/hooks/use-app'
import Toast from '@/app/components/base/toast'

export function AppList() {
  const [apps, setApps] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      // Phase 7: 공개 챗봇 목록 API 사용 (익명 접근 가능)
      const response = await fetch('/api/apps/public')

      if (!response.ok) {
        throw new Error('Failed to fetch apps')
      }

      const data = await response.json()
      setApps(data)
    }
    catch (error) {
      console.error('Failed to fetch apps:', error)
      Toast.notify({
        type: 'error',
        message: '챗봇 목록을 불러오는데 실패했습니다.',
      })
    }
    finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">
          사용 가능한 챗봇이 없습니다
        </p>
        <p className="text-gray-500 text-sm">
          관리자에게 문의하여 챗봇을 추가해주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map(app => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
