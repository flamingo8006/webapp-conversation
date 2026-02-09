'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, MessageSquare, Users, Activity, Zap, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'

interface DailyStats {
  id: string
  date: string
  totalSessions: number
  newSessions: number
  authSessions: number
  anonymousSessions: number
  totalMessages: number
  userMessages: number
  assistantMessages: number
  uniqueUsers: number
  totalTokens: number
  likeFeedbacks: number
  dislikeFeedbacks: number
}

interface AppRanking {
  appId: string
  app: {
    id: string
    nameKo: string | null
    nameEn: string | null
    name: string
  } | null
  totalMessages: number
  totalSessions: number
}

interface RealTimeStats {
  todaySessions: number
  todayMessages: number
  activeApps: number
  recentMessages: Array<{
    id: string
    role: string
    content: string
    appName: string
    createdAt: string
  }>
}

interface Overview {
  period: { startDate: string, endDate: string, days: number }
  totals: { sessions: number, messages: number, users: number, tokens: number }
  daily: DailyStats[]
}

export default function StatsPage() {
  const { isSuperAdmin } = useAdminAuth()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [appRanking, setAppRanking] = useState<AppRanking[]>([])
  const [realTime, setRealTime] = useState<RealTimeStats | null>(null)
  const [trendData, setTrendData] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, trendRes] = await Promise.all([
        fetch(`/api/admin/stats/overview?days=${period}`),
        fetch(`/api/admin/stats/trend?days=${period}`),
      ])

      if (overviewRes.ok) {
        const data = await overviewRes.json()
        setOverview(data.overview)
        setAppRanking(data.appRanking)
        setRealTime(data.realTime)
      }

      if (trendRes.ok) {
        const data = await trendRes.json()
        setTrendData(data.data)
      }
    }
    catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const chartData = trendData.map(d => ({
    date: formatDate(d.date),
    메시지: d.totalMessages,
    세션: d.totalSessions,
    좋아요: d.likeFeedbacks,
    싫어요: d.dislikeFeedbacks,
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용 통계</h1>
          <p className="mt-1 text-sm text-gray-500">
            챗봇 사용 현황을 모니터링합니다.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">최근 7일</SelectItem>
              <SelectItem value="14">최근 14일</SelectItem>
              <SelectItem value="30">최근 30일</SelectItem>
              <SelectItem value="90">최근 90일</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 실시간 통계 */}
      {realTime && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 세션</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTime.todaySessions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">실시간</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 메시지</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTime.todayMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">실시간</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 챗봇</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTime.activeApps}</div>
              <p className="text-xs text-muted-foreground">운영 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">기간 총 토큰</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview?.totals.tokens.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                최근
                {' '}
                {period}
                일
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 기간 통계 */}
      {overview && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">기간 세션</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overview.totals.sessions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                최근
                {' '}
                {period}
                일
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">기간 메시지</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overview.totals.messages.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                최근
                {' '}
                {period}
                일
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <ThumbsUp className="h-4 w-4 inline mr-1" />
                좋아요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {trendData.reduce((sum, d) => sum + d.likeFeedbacks, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <ThumbsDown className="h-4 w-4 inline mr-1" />
                싫어요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {trendData.reduce((sum, d) => sum + d.dislikeFeedbacks, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 트렌드 차트 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>메시지/세션 추이</CardTitle>
            <CardDescription>
              최근
              {' '}
              {period}
              일 일별 추이
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0
                ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="메시지" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="세션" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )
                : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    데이터가 없습니다.
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>피드백 추이</CardTitle>
            <CardDescription>사용자 피드백 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData.length > 0
                ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="좋아요" fill="#22c55e" />
                      <Bar dataKey="싫어요" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )
                : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    데이터가 없습니다.
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 앱별 순위 & 최근 활동 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>챗봇 사용 순위</CardTitle>
            <CardDescription>메시지 수 기준</CardDescription>
          </CardHeader>
          <CardContent>
            {appRanking.length > 0
              ? (
                <div className="space-y-4">
                  {appRanking.map((item, index) => (
                    <div key={item.appId} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.app?.nameKo || item.app?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.totalSessions.toLocaleString()}
                          {' '}
                          세션
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          {item.totalMessages.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">메시지</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                <div className="text-center py-8 text-gray-500">
                  데이터가 없습니다.
                </div>
              )}
          </CardContent>
        </Card>

        {isSuperAdmin
          ? (
            <Card>
              <CardHeader>
                <CardTitle>최근 메시지</CardTitle>
                <CardDescription>오늘 최근 활동</CardDescription>
              </CardHeader>
              <CardContent>
                {realTime && realTime.recentMessages.length > 0
                  ? (
                    <div className="space-y-4">
                      {realTime.recentMessages.slice(0, 5).map(msg => (
                        <div key={msg.id} className="border-l-2 border-purple-300 pl-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              {msg.appName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleTimeString('ko-KR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 truncate mt-1">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                  : (
                    <div className="text-center py-8 text-gray-500">
                      오늘 메시지가 없습니다.
                    </div>
                  )}
              </CardContent>
            </Card>
          )
          : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  사용자 유형 분석
                </CardTitle>
                <CardDescription>인증/익명 사용 비율</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0
                  ? (() => {
                    const totalAuth = trendData.reduce((sum, d) => sum + d.authSessions, 0)
                    const totalAnon = trendData.reduce((sum, d) => sum + d.anonymousSessions, 0)
                    const totalAll = totalAuth + totalAnon
                    const uniqueUsersArr = trendData.map(d => d.uniqueUsers)
                    const avgUsers = uniqueUsersArr.length > 0
                      ? Math.round(uniqueUsersArr.reduce((a, b) => a + b, 0) / uniqueUsersArr.length)
                      : 0
                    const peakUsers = Math.max(...uniqueUsersArr, 0)
                    const peakDate = trendData.find(d => d.uniqueUsers === peakUsers)

                    const sessionChartData = trendData.map(d => ({
                      date: `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`,
                      인증: d.authSessions,
                      익명: d.anonymousSessions,
                    }))

                    return (
                      <div className="space-y-5">
                        {/* 기간 합산 */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">기간 합산</p>
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${totalAll > 0 ? (totalAuth / totalAll) * 100 : 0}%` }}
                              />
                              <div
                                className="h-full bg-orange-400"
                                style={{ width: `${totalAll > 0 ? (totalAnon / totalAll) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
                              인증:
                              {' '}
                              <span className="font-medium text-gray-700">{totalAuth}</span>
                              {totalAll > 0 && ` (${Math.round((totalAuth / totalAll) * 100)}%)`}
                            </span>
                            <span>
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />
                              익명:
                              {' '}
                              <span className="font-medium text-gray-700">{totalAnon}</span>
                              {totalAll > 0 && ` (${Math.round((totalAnon / totalAll) * 100)}%)`}
                            </span>
                          </div>
                        </div>

                        {/* 일별 추이 차트 */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">일별 추이</p>
                          <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={sessionChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="인증" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="익명" stackId="a" fill="#fb923c" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* 활성 사용자 */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">활성 사용자</p>
                          <div className="flex items-center gap-4">
                            <div className="text-center p-2 bg-blue-50 rounded-lg flex-1">
                              <p className="text-lg font-bold text-blue-600">{avgUsers}</p>
                              <p className="text-xs text-gray-500">일평균</p>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded-lg flex-1">
                              <p className="text-lg font-bold text-purple-600">{peakUsers}</p>
                              <p className="text-xs text-gray-500">
                                피크
                                {peakDate && ` (${new Date(peakDate.date).getMonth() + 1}/${new Date(peakDate.date).getDate()})`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                  : (
                    <div className="text-center py-8 text-gray-500">
                      데이터가 없습니다.
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}
