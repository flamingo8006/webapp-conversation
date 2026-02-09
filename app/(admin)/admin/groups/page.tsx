'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, RefreshCw, Users } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface AdminGroup {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  _count?: {
    members: number
    apps: number
  }
}

export default function GroupsPage() {
  const { isSuperAdmin } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminGroup | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push(adminPath())
      return
    }
    fetchGroups()
  }, [isSuperAdmin, router])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    }
    catch (error) {
      console.error('Failed to fetch groups:', error)
    }
    finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) { return }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/groups/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ title: '그룹이 삭제되었습니다.' })
        await fetchGroups()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '그룹 삭제에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to delete group:', error)
      toast({ title: '그룹 삭제 중 오류가 발생했습니다.', variant: 'destructive' })
    }
    finally {
      setActionLoading(false)
      setDeleteTarget(null)
    }
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            관리자 그룹을 생성하고 챗봇을 공동 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchGroups} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button asChild>
            <Link href={adminPath('/groups/new')}>
              <Plus className="mr-2 h-4 w-4" />
              그룹 추가
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>그룹 목록</CardTitle>
          <CardDescription>등록된 모든 관리자 그룹을 확인하고 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading
            ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            )
            : groups.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">등록된 그룹이 없습니다.</div>
              )
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>그룹명</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead>멤버</TableHead>
                      <TableHead>챗봇</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map(group => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {group.description || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {group._count?.members || 0}
                          </span>
                        </TableCell>
                        <TableCell>{group._count?.apps || 0}</TableCell>
                        <TableCell>
                          <Badge variant={group.isActive ? 'default' : 'secondary'}>
                            {group.isActive ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={adminPath(`/groups/${group.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(group)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" 그룹을 삭제하시겠습니까?
              <br />
              그룹에 소속된 멤버와 챗봇의 그룹 배정이 해제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? '처리 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
