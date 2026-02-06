'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Search, Check, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'

interface AuditLog {
  id: string
  actorType: string
  actorId: string | null
  actorLoginId: string
  actorName: string
  actorRole: string | null
  action: string
  entityType: string
  entityId: string | null
  changes: any
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  requestPath: string | null
  success: boolean
  errorMessage: string | null
  createdAt: string
}

interface AuditLogStats {
  total: number
  failures: number
  byAction: { action: string, count: number }[]
  byEntityType: { entityType: string, count: number }[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const router = useRouter()
  const { isSuperAdmin, loading: authLoading } = useAdminAuth()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [actions, setActions] = useState<string[]>([])
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // 필터
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [successFilter, setSuccessFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // 슈퍼관리자 권한 체크
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/admin')
    }
  }, [authLoading, isSuperAdmin, router])

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      if (actionFilter)
      { params.set('action', actionFilter) }
      if (entityTypeFilter)
      { params.set('entityType', entityTypeFilter) }
      if (successFilter)
      { params.set('success', successFilter) }

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    }
    catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
    finally {
      setLoading(false)
    }
  }, [actionFilter, entityTypeFilter, successFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActions(data.actions)
        setEntityTypes(data.entityTypes)
      }
    }
    catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [fetchLogs])

  useEffect(() => {
    fetchLogs(1)
  }, [actionFilter, entityTypeFilter, successFilter, fetchLogs])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE'))
    { return 'bg-green-100 text-green-800' }
    if (action.includes('UPDATE'))
    { return 'bg-blue-100 text-blue-800' }
    if (action.includes('DELETE'))
    { return 'bg-red-100 text-red-800' }
    if (action.includes('LOGIN'))
    { return 'bg-purple-100 text-purple-800' }
    if (action.includes('LOGOUT'))
    { return 'bg-gray-100 text-gray-800' }
    return 'bg-gray-100 text-gray-800'
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery)
    { return true }
    const query = searchQuery.toLowerCase()
    return (
      log.actorLoginId.toLowerCase().includes(query)
      || log.actorName.toLowerCase().includes(query)
      || log.entityId?.toLowerCase().includes(query)
      || log.action.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 내 모든 활동 기록을 조회합니다.
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchLogs(); fetchStats() }} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">최근 7일 로그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">실패 건수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">주요 액션</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.byAction.slice(0, 3).map(a => (
                  <div key={a.action} className="flex justify-between">
                    <span>{a.action}</span>
                    <span className="text-gray-500">{a.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">대상 유형</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.byEntityType.slice(0, 3).map(t => (
                  <div key={t.entityType} className="flex justify-between">
                    <span>{t.entityType}</span>
                    <span className="text-gray-500">{t.count}</span>
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
                placeholder="검색 (ID, 이름, 액션...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter || 'all'} onValueChange={v => setActionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="액션 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter || 'all'} onValueChange={v => setEntityTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="대상 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={successFilter || 'all'} onValueChange={v => setSuccessFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="결과" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">성공</SelectItem>
                <SelectItem value="false">실패</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 로그 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>감사 로그 목록</CardTitle>
          <CardDescription>
            총
            {' '}
            {pagination.total.toLocaleString()}
            건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading
            ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            )
            : filteredLogs.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  감사 로그가 없습니다.
                </div>
              )
              : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시간</TableHead>
                        <TableHead>행위자</TableHead>
                        <TableHead>액션</TableHead>
                        <TableHead>대상</TableHead>
                        <TableHead>결과</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map(log => (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{log.actorName}</span>
                              <span className="text-gray-500 text-sm ml-2">({log.actorLoginId})</span>
                            </div>
                            <div className="text-xs text-gray-400">{log.actorType}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(log.action)} variant="outline">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                {log.entityId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.success
                              ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <Check className="h-4 w-4" />
                                </span>
                              )
                              : (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <X className="h-4 w-4" />
                                </span>
                              )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {log.ipAddress || '-'}
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
                        onClick={() => fetchLogs(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs(pagination.page + 1)}
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
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>감사 로그 상세</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">행위자</div>
                  <div className="font-medium">
                    {selectedLog.actorName}
                    {' '}
                    (
                    {selectedLog.actorLoginId}
                    )
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedLog.actorType}
                    {selectedLog.actorRole && ` / ${selectedLog.actorRole}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">액션</div>
                  <Badge className={getActionBadgeColor(selectedLog.action)} variant="outline">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500">대상</div>
                  <div className="font-medium">{selectedLog.entityType}</div>
                  <div className="text-xs text-gray-400">{selectedLog.entityId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">결과</div>
                  {selectedLog.success
                    ? (
                      <span className="text-green-600">성공</span>
                    )
                    : (
                      <span className="text-red-600">
                        실패:
                        {selectedLog.errorMessage}
                      </span>
                    )}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">IP 주소</div>
                <div>{selectedLog.ipAddress || '-'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">요청 경로</div>
                <div className="text-sm font-mono">{selectedLog.requestPath || '-'}</div>
              </div>

              {selectedLog.changes && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">변경 내용</div>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">메타데이터</div>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <div className="text-sm text-gray-500">User Agent</div>
                  <div className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
