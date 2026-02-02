'use client'

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { AppCard } from './app-card'
import type { AppConfig } from '@/hooks/use-app'
import Toast from '@/app/components/base/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function AppCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppCardSkeleton />
        <AppCardSkeleton />
        <AppCardSkeleton />
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-muted-foreground mb-4">
          <MessageSquare className="w-16 h-16 mx-auto" strokeWidth={1.5} />
        </div>
        <p className="text-foreground text-lg font-medium mb-2">
          사용 가능한 챗봇이 없습니다
        </p>
        <p className="text-muted-foreground text-sm">
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
