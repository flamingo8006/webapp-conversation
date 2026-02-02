'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppTable } from '@/app/components/admin/app-table'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'

export default function AppsListPage() {
  const [apps, setApps] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/admin/apps')

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

  const handleDelete = (appId: string) => {
    setApps(apps.filter(app => app.id !== appId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">챗봇 관리</h1>
          <p className="mt-2 text-gray-600">
            등록된 챗봇을 관리하고 새로운 챗봇을 추가할 수 있습니다
          </p>
        </div>
        <Link
          href="/admin/apps/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <span className="mr-2">➕</span>
          새 챗봇 추가
        </Link>
      </div>

      {/* 테이블 */}
      <AppTable apps={apps} onDelete={handleDelete} />
    </div>
  )
}
