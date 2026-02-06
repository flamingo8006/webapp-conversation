'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, Plus, List, MessageSquare, Users, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'

interface DashboardStats {
  totalApps: number
  activeApps: number
  todaySessions: number
  todayMessages: number
  newErrors: number
  weeklyMessages: number
}

interface AppRankingItem {
  appId: string | null
  app: { nameKo?: string, nameEn?: string, name: string } | null
  totalMessages: number
  totalSessions: number
  totalTokens: number
}

export default function AdminDashboard() {
  const { isSuperAdmin } = useAdminAuth()

  const [stats, setStats] = useState<DashboardStats>({
    totalApps: 0,
    activeApps: 0,
    todaySessions: 0,
    todayMessages: 0,
    newErrors: 0,
    weeklyMessages: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [appRanking, setAppRanking] = useState<AppRankingItem[]>([])

  useEffect(() => {
    fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin])

  const fetchStats = async () => {
    try {
      // 챗봇 통계
      const appsRes = await fetch('/api/admin/apps')
      if (appsRes.ok) {
        const apps = await appsRes.json()
        setStats(prev => ({
          ...prev,
          totalApps: apps.length,
          activeApps: apps.filter((app: any) => app.isActive).length,
        }))
      }

      // 사용 통계
      const statsRes = await fetch('/api/admin/stats/overview?days=7')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(prev => ({
          ...prev,
          todaySessions: data.realTime?.todaySessions || 0,
          todayMessages: data.realTime?.todayMessages || 0,
          weeklyMessages: data.overview?.totals?.messages || 0,
        }))
        setRecentActivity(data.realTime?.recentMessages || [])
        setAppRanking(data.appRanking || [])
      }

      // 에러 통계 (슈퍼관리자만)
      if (isSuperAdmin) {
        const errorsRes = await fetch('/api/admin/errors/stats')
        if (errorsRes.ok) {
          const data = await errorsRes.json()
          setStats(prev => ({
            ...prev,
            newErrors: data.stats?.newCount || 0,
          }))
        }
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

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">활성 챗봇</p>
                <p className="text-2xl font-bold">
                  {stats.activeApps}
                  <span className="text-sm text-gray-400 ml-1">
                    /
                    {stats.totalApps}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">오늘 메시지</p>
                <p className="text-2xl font-bold">{stats.todayMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">오늘 세션</p>
                <p className="text-2xl font-bold">{stats.todaySessions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">미해결 에러</p>
                  <p className="text-2xl font-bold">{stats.newErrors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 주간 통계 & 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              주간 요약
            </CardTitle>
            <CardDescription>챗봇별 메시지 및 토큰 수 (최근 7일)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">주간 총 메시지</p>
                  <p className="text-2xl font-bold text-green-600">{stats.weeklyMessages.toLocaleString()}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">챗봇별 사용량 (Top 5)</p>
                {appRanking.length > 0
                  ? (
                    <div className="space-y-2">
                      {appRanking.slice(0, 5).map((item, index) => (
                        <div key={item.appId || index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {item.app?.nameKo || item.app?.name || '알 수 없음'}
                          </span>
                          <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                            <span className="font-medium text-gray-700">{item.totalMessages.toLocaleString()}</span>
                            건
                            <span className="mx-1">·</span>
                            <span className="font-medium text-gray-700">{item.totalTokens.toLocaleString()}</span>
                            토큰
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터가 없습니다.
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>오늘 최근 메시지</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/activity" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                더 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0
              ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 4).map((msg: any) => (
                    <div key={msg.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                      <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 ${
                        msg.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}
                      >
                        {msg.role === 'user' ? '사용자' : 'AI'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{msg.content}</p>
                        <p className="text-xs text-gray-400">
                          {msg.appName}
                          {' '}
                          ·
                          {new Date(msg.createdAt).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  오늘 활동이 없습니다.
                </div>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <p className="text-sm text-muted-foreground">새로운 챗봇 등록</p>
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
                    <p className="text-sm text-muted-foreground">챗봇 목록 관리</p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start border-dashed"
              asChild
            >
              <Link href="/admin/stats">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-2 mr-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">사용 통계</p>
                    <p className="text-sm text-muted-foreground">상세 통계 보기</p>
                  </div>
                </div>
              </Link>
            </Button>

            {isSuperAdmin && (
              <Button
                variant="outline"
                className="h-auto p-4 justify-start border-dashed"
                asChild
              >
                <Link href="/admin/errors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-lg p-2 mr-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">에러 모니터링</p>
                      <p className="text-sm text-muted-foreground">시스템 에러 확인</p>
                    </div>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
