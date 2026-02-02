'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, CheckCircle, PauseCircle, Plus, List } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalApps: 0,
    activeApps: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/apps')
      if (response.ok) {
        const apps = await response.json()
        setStats({
          totalApps: apps.length,
          activeApps: apps.filter((app: any) => app.isActive).length,
        })
      }
    }
    catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="mt-2 text-muted-foreground">DGIST AI 챗봇 플랫폼 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">전체 챗봇</p>
                <p className="text-2xl font-bold">{stats.totalApps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">활성 챗봇</p>
                <p className="text-2xl font-bold">{stats.activeApps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <PauseCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">비활성 챗봇</p>
                <p className="text-2xl font-bold">
                  {stats.totalApps - stats.activeApps}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start border-dashed"
              asChild
            >
              <Link href="/admin/apps/new">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 mr-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">새 챗봇 추가</p>
                    <p className="text-sm text-muted-foreground">새로운 챗봇을 등록합니다</p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start border-dashed"
              asChild
            >
              <Link href="/admin/apps">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2 mr-3">
                    <List className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">챗봇 관리</p>
                    <p className="text-sm text-muted-foreground">등록된 챗봇을 관리합니다</p>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
