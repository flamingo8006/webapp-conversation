'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { AppTable } from '@/app/components/admin/app-table'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'
import { Button } from '@/components/ui/button'

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">챗봇 관리</h1>
          <p className="mt-2 text-muted-foreground">
            등록된 챗봇을 관리하고 새로운 챗봇을 추가할 수 있습니다
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/apps/new">
            <Plus className="mr-2 h-4 w-4" />
            새 챗봇 추가
          </Link>
        </Button>
      </div>

      {/* 테이블 */}
      <AppTable apps={apps} onDelete={handleDelete} />
    </div>
  )
}
