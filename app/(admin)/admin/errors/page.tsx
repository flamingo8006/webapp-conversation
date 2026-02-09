'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Search, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'

interface ErrorLog {
  id: string
  errorType: string
  errorCode: string | null
  message: string
  stackTrace: string | null
  source: string
  requestPath: string | null
  requestMethod: string | null
  userEmpNo: string | null
  adminId: string | null
  sessionId: string | null
  appId: string | null
  ipAddress: string | null
  userAgent: string | null
  status: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolution: string | null
  createdAt: string
}

interface ErrorStats {
  total: number
  newCount: number
  byType: { type: string, count: number }[]
  bySource: { source: string, count: number }[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ErrorsPage() {
  const router = useRouter()
  const { isSuperAdmin, loading: authLoading } = useAdminAuth()

  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [errorTypes, setErrorTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [statusDialogError, setStatusDialogError] = useState<ErrorLog | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // 필터
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // 슈퍼관리자 권한 체크
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace(adminPath())
    }
  }, [authLoading, isSuperAdmin, router])

  const fetchErrors = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (errorTypeFilter)
      { params.set('errorType', errorTypeFilter) }
      if (sourceFilter)
      { params.set('source', sourceFilter) }
      if (statusFilter)
      { params.set('status', statusFilter) }

      const response = await fetch(`/api/admin/errors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors)
        setPagination(data.pagination)
      }
    }
    catch (error) {
      console.error('Failed to fetch errors:', error)
    }
    finally {
      setLoading(false)
    }
  }, [errorTypeFilter, sourceFilter, statusFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/errors/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setErrorTypes(data.errorTypes)
      }
    }
    catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchErrors()
    fetchStats()
  }, [fetchErrors])

  useEffect(() => {
    fetchErrors(1)
  }, [errorTypeFilter, sourceFilter, statusFilter, fetchErrors])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">New</Badge>
      case 'investigating':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">조사중</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">해결됨</Badge>
      case 'ignored':
        return <Badge variant="secondary">무시</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'API_ROUTE':
        return <Badge variant="outline">API</Badge>
      case 'MIDDLEWARE':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Middleware</Badge>
      case 'CLIENT':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Client</Badge>
      default:
        return <Badge variant="outline">{source}</Badge>
    }
  }

  const handleStatusUpdate = async () => {
    if (!statusDialogError || !newStatus)
    { return }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/errors/${statusDialogError.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolution }),
      })

      if (response.ok) {
        await fetchErrors(pagination.page)
        await fetchStats()
        setStatusDialogError(null)
        setNewStatus('')
        setResolution('')
      }
    }
    catch (error) {
      console.error('Failed to update status:', error)
    }
    finally {
      setActionLoading(false)
    }
  }

  const filteredErrors = errors.filter((error) => {
    if (!searchQuery)
    { return true }
    const query = searchQuery.toLowerCase()
    return (
      error.message.toLowerCase().includes(query)
      || error.errorType.toLowerCase().includes(query)
      || error.requestPath?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">에러 모니터링</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 에러를 모니터링하고 관리합니다.
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchErrors(); fetchStats() }} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">최근 7일 에러</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">미해결 에러</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.newCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">에러 유형</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.byType.slice(0, 3).map(t => (
                  <div key={t.type} className="flex justify-between">
                    <span className="truncate">{t.type}</span>
                    <span className="text-gray-500">{t.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">소스별</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.bySource.map(s => (
                  <div key={s.source} className="flex justify-between">
                    <span>{s.source}</span>
                    <span className="text-gray-500">{s.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="검색 (메시지, 유형, 경로...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={errorTypeFilter || 'all'} onValueChange={v => setErrorTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="에러 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {errorTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter || 'all'} onValueChange={v => setSourceFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="소스" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="API_ROUTE">API</SelectItem>
                <SelectItem value="MIDDLEWARE">Middleware</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">조사중</SelectItem>
                <SelectItem value="resolved">해결됨</SelectItem>
                <SelectItem value="ignored">무시</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 에러 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>에러 목록</CardTitle>
          <CardDescription>
            총
            {' '}
            {pagination.total}
            건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading
            ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            )
            : filteredErrors.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  에러 로그가 없습니다.
                </div>
              )
              : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>메시지</TableHead>
                        <TableHead>소스</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredErrors.map(error => (
                        <TableRow key={error.id}>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(error.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{error.errorType}</span>
                            {error.errorCode && (
                              <span className="text-xs text-gray-400 ml-2">({error.errorCode})</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[300px] truncate" title={error.message}>
                              {error.message}
                            </div>
                            {error.requestPath && (
                              <div className="text-xs text-gray-400">
                                {error.requestMethod}
                                {' '}
                                {error.requestPath}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getSourceBadge(error.source)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(error.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedError(error)}
                                title="상세 보기"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setStatusDialogError(error); setNewStatus(error.status) }}
                                title="상태 변경"
                              >
                                {error.status === 'new' && <Clock className="h-4 w-4" />}
                                {error.status === 'investigating' && <Clock className="h-4 w-4 text-yellow-500" />}
                                {error.status === 'resolved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {error.status === 'ignored' && <XCircle className="h-4 w-4 text-gray-400" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* 페이지네이션 */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
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
                        onClick={() => fetchErrors(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchErrors(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
        </CardContent>
      </Card>

      {/* 상세 다이얼로그 */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>에러 상세</DialogTitle>
            <DialogDescription>
              {selectedError && formatDate(selectedError.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">에러 유형</div>
                  <div className="font-mono">{selectedError.errorType}</div>
                  {selectedError.errorCode && (
                    <div className="text-xs text-gray-400">
                      코드:
                      {selectedError.errorCode}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">소스</div>
                  {getSourceBadge(selectedError.source)}
                </div>
                <div>
                  <div className="text-sm text-gray-500">상태</div>
                  {getStatusBadge(selectedError.status)}
                  {selectedError.resolvedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(selectedError.resolvedAt)}
                      에 해결
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">요청 정보</div>
                  <div className="font-mono text-sm">
                    {selectedError.requestMethod}
                    {' '}
                    {selectedError.requestPath || '-'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">메시지</div>
                <div className="bg-red-50 p-3 rounded text-red-800">{selectedError.message}</div>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">스택 트레이스</div>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">IP 주소</div>
                  <div>{selectedError.ipAddress || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">App ID</div>
                  <div className="font-mono text-sm">{selectedError.appId || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Session ID</div>
                  <div className="font-mono text-sm truncate">{selectedError.sessionId || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">User</div>
                  <div>{selectedError.userEmpNo || selectedError.adminId || '-'}</div>
                </div>
              </div>

              {selectedError.resolution && (
                <div>
                  <div className="text-sm text-gray-500">해결 방법</div>
                  <div className="bg-green-50 p-3 rounded text-green-800">{selectedError.resolution}</div>
                </div>
              )}

              {selectedError.userAgent && (
                <div>
                  <div className="text-sm text-gray-500">User Agent</div>
                  <div className="text-xs text-gray-600 break-all">{selectedError.userAgent}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={!!statusDialogError} onOpenChange={() => { setStatusDialogError(null); setNewStatus(''); setResolution('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>에러 상태 변경</DialogTitle>
            <DialogDescription>
              에러의 상태를 변경하고 해결 방법을 기록하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">조사중</SelectItem>
                  <SelectItem value="resolved">해결됨</SelectItem>
                  <SelectItem value="ignored">무시</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'resolved' && (
              <div className="space-y-2">
                <Label>해결 방법</Label>
                <Textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="어떻게 해결했는지 기록하세요..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusDialogError(null); setNewStatus(''); setResolution('') }}>
              취소
            </Button>
            <Button onClick={handleStatusUpdate} disabled={actionLoading || !newStatus}>
              {actionLoading ? '처리 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
