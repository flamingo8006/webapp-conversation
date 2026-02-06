'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MessageSquare, Bot, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface MessageData {
  id: string
  createdAt: string
  role: string
  content: string
  contentPreview: string
}

interface QAPair {
  id: string
  question: MessageData
  answer: MessageData | null
  appId: string
  appName: string
  userId: string | null
  userName: string | null
  isAnonymous: boolean
  isDeleted: boolean
  sessionId: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ChatbotApp {
  id: string
  name: string
  nameKo?: string
  nameEn?: string
}

export default function ActivityPage() {
  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<ChatbotApp[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 필터 상태
  const [selectedApp, setSelectedApp] = useState<string>('all')
  const [period, setPeriod] = useState<string>('7')
  const [userSearch, setUserSearch] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/admin/apps')
      if (res.ok) {
        const data = await res.json()
        setApps(data)
      }
    }
    catch (error) {
      console.error('Failed to fetch apps:', error)
    }
  }

  const fetchActivity = useCallback(async (page: number = 1) => {
    setLoading(true)
    setExpandedIds(new Set())
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')

      if (selectedApp !== 'all') {
        params.set('appId', selectedApp)
      }

      // 기간 계산
      const endDate = new Date()
      const startDate = new Date()
      if (period === '0') {
        // 오늘만
        startDate.setHours(0, 0, 0, 0)
      }
      else {
        startDate.setDate(startDate.getDate() - Number.parseInt(period) + 1)
        startDate.setHours(0, 0, 0, 0)
      }
      endDate.setHours(23, 59, 59, 999)

      params.set('startDate', startDate.toISOString())
      params.set('endDate', endDate.toISOString())

      if (userSearch.trim()) {
        params.set('userName', userSearch.trim())
      }

      const res = await fetch(`/api/admin/activity?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQaPairs(data.qaPairs)
        setPagination(data.pagination)
      }
    }
    catch (error) {
      console.error('Failed to fetch activity:', error)
    }
    finally {
      setLoading(false)
    }
  }, [selectedApp, period, userSearch])

  useEffect(() => {
    fetchApps()
  }, [])

  useEffect(() => {
    fetchActivity(1)
  }, [fetchActivity])

  const handleSearch = () => {
    setUserSearch(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      }
      else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">활동 내역</h1>
        <p className="mt-2 text-muted-foreground">챗봇 사용 활동 내역을 확인합니다</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>메시지 내역</CardTitle>
              <CardDescription>
                총
                {' '}
                {qaPairs.length.toLocaleString()}
                건의 대화
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActivity(pagination.page)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 필터 영역 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 sm:max-w-[200px]">
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger>
                  <SelectValue placeholder="챗봇 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 챗봇</SelectItem>
                  {apps.map(app => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.nameKo || app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 sm:max-w-[180px]">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="기간 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">오늘</SelectItem>
                  <SelectItem value="7">최근 7일</SelectItem>
                  <SelectItem value="14">최근 14일</SelectItem>
                  <SelectItem value="30">최근 30일</SelectItem>
                  <SelectItem value="90">최근 90일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 sm:max-w-[300px]">
              <div className="flex gap-2">
                <Input
                  placeholder="사용자 이름 검색..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[140px]">시간</TableHead>
                  <TableHead className="w-[120px]">챗봇</TableHead>
                  <TableHead className="w-[100px]">사용자</TableHead>
                  <TableHead>질문</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        로딩 중...
                      </TableCell>
                    </TableRow>
                  )
                  : qaPairs.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          활동 내역이 없습니다.
                        </TableCell>
                      </TableRow>
                    )
                    : (
                      qaPairs.map(pair => (
                        <Fragment key={pair.id}>
                          <TableRow
                            className={`cursor-pointer hover:bg-muted/50 ${pair.isDeleted ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                            onClick={() => toggleExpand(pair.id)}
                          >
                            <TableCell className="text-center">
                              {expandedIds.has(pair.id)
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(pair.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center gap-2">
                                {pair.appName}
                                {pair.isDeleted && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/50 rounded">
                                    <Trash2 className="h-3 w-3" />
                                    삭제됨
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {pair.isAnonymous
                                ? <span className="text-muted-foreground">익명</span>
                                : pair.userName || '-'}
                            </TableCell>
                            <TableCell className="text-sm max-w-md truncate">
                              {pair.question.contentPreview}
                            </TableCell>
                          </TableRow>
                          {expandedIds.has(pair.id) && (
                            <TableRow>
                              <TableCell colSpan={5} className="p-0">
                                <div className={`p-4 border-t ${pair.isDeleted ? 'bg-red-50/30 dark:bg-red-950/10' : 'bg-muted/30'}`}>
                                  {pair.isDeleted && (
                                    <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      이 대화는 사용자에 의해 삭제되었습니다.
                                    </div>
                                  )}
                                  {/* 질문 */}
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="h-4 w-4 text-blue-500" />
                                      <span className="text-sm font-medium text-blue-700">질문</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDateTime(pair.question.createdAt)}
                                      </span>
                                    </div>
                                    <div className="pl-6 text-sm whitespace-pre-wrap break-words">
                                      {pair.question.content}
                                    </div>
                                  </div>
                                  {/* 답변 */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Bot className="h-4 w-4 text-green-500" />
                                      <span className="text-sm font-medium text-green-700">AI 답변</span>
                                      {pair.answer && (
                                        <span className="text-xs text-muted-foreground">
                                          {formatDateTime(pair.answer.createdAt)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="pl-6 text-sm whitespace-pre-wrap break-words">
                                      {pair.answer
                                        ? pair.answer.content
                                        : <span className="text-muted-foreground italic">답변을 찾을 수 없습니다</span>}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))
                    )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                페이지
                {' '}
                {pagination.page}
                {' '}
                /
                {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivity(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivity(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
