'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Key, UserCheck, UserX, RefreshCw, Lock, Unlock } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Admin {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: string
  isActive: boolean
  loginAttempts: number
  lockedUntil: string | null
  lastLoginAt: string | null
  createdAt: string
}

interface AdminCounts {
  total: number
  active: number
  superAdmins: number
  locked: number
}

export default function AdminsPage() {
  const { isSuperAdmin } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [counts, setCounts] = useState<AdminCounts>({ total: 0, active: 0, superAdmins: 0, locked: 0 })
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
  const [unlockId, setUnlockId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin')
      return
    }
    fetchAdmins()
  }, [isSuperAdmin, router])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins)
        setCounts(data.counts)
      }
    }
    catch (error) {
      console.error('Failed to fetch admins:', error)
    }
    finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId)
    { return }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${deleteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ title: '관리자가 비활성화되었습니다.' })
        await fetchAdmins()
      }
    }
    catch (error) {
      console.error('Failed to delete admin:', error)
    }
    finally {
      setActionLoading(false)
      setDeleteId(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword)
    { return }

    setPasswordErrors([])
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${resetPasswordId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: '비밀번호가 초기화되었습니다.' })
        setResetPasswordId(null)
        setNewPassword('')
      }
      else {
        // 비밀번호 정책 에러 표시
        if (data.details) {
          setPasswordErrors(data.details)
        }
        else {
          toast({ title: data.error || '비밀번호 초기화에 실패했습니다.', variant: 'destructive' })
        }
      }
    }
    catch (error) {
      console.error('Failed to reset password:', error)
      toast({ title: '비밀번호 초기화 중 오류가 발생했습니다.', variant: 'destructive' })
    }
    finally {
      setActionLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockId)
    { return }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${unlockId}/unlock`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({ title: '계정 잠금이 해제되었습니다.' })
        await fetchAdmins()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '잠금 해제에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to unlock admin:', error)
      toast({ title: '잠금 해제 중 오류가 발생했습니다.', variant: 'destructive' })
    }
    finally {
      setActionLoading(false)
      setUnlockId(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr)
    { return '-' }
    return new Date(dateStr).toLocaleString('ko-KR')
  }

  const isLocked = (admin: Admin) => {
    if (!admin.lockedUntil)
    { return false }
    return new Date(admin.lockedUntil) > new Date()
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 관리자 계정을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAdmins} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button asChild>
            <Link href="/admin/admins/new">
              <Plus className="mr-2 h-4 w-4" />
              관리자 추가
            </Link>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 관리자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">활성 관리자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">슈퍼관리자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{counts.superAdmins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">잠긴 계정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.locked}</div>
          </CardContent>
        </Card>
      </div>

      {/* 관리자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
          <CardDescription>등록된 모든 관리자를 확인하고 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading
            ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            )
            : admins.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">등록된 관리자가 없습니다.</div>
              )
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>로그인 ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>부서</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>최근 로그인</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map(admin => (
                      <TableRow key={admin.id} className={isLocked(admin) ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{admin.loginId}</TableCell>
                        <TableCell>{admin.name}</TableCell>
                        <TableCell>{admin.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                            {admin.role === 'super_admin' ? '슈퍼관리자' : '관리자'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isLocked(admin)
                            ? (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <Lock className="h-4 w-4" />
                                잠김
                              </span>
                            )
                            : admin.isActive
                              ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <UserCheck className="h-4 w-4" />
                                  활성
                                </span>
                              )
                              : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <UserX className="h-4 w-4" />
                                  비활성
                                </span>
                              )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(admin.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isLocked(admin) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUnlockId(admin.id)}
                                title="잠금 해제"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResetPasswordId(admin.id)
                                setNewPassword('')
                                setPasswordErrors([])
                              }}
                              title="비밀번호 초기화"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/admins/${admin.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(admin.id)}
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
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>관리자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 관리자 계정을 비활성화하시겠습니까? 비활성화된 관리자는 로그인할 수 없습니다.
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

      {/* 잠금 해제 확인 다이얼로그 */}
      <AlertDialog open={!!unlockId} onOpenChange={() => setUnlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 잠금 해제</AlertDialogTitle>
            <AlertDialogDescription>
              이 관리자 계정의 잠금을 해제하시겠습니까? 로그인 시도 횟수가 초기화됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlock}
              disabled={actionLoading}
            >
              {actionLoading ? '처리 중...' : '잠금 해제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 비밀번호 초기화 다이얼로그 */}
      <Dialog open={!!resetPasswordId} onOpenChange={() => { setResetPasswordId(null); setNewPassword(''); setPasswordErrors([]) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>
              새 비밀번호를 입력하세요. 비밀번호 정책을 준수해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="10~20자, 영대소문자/숫자/특수문자 포함"
                className="mt-2"
              />
            </div>

            {/* 비밀번호 정책 안내 */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">비밀번호 정책:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>10~20자 길이</li>
                <li>영문 대문자 포함</li>
                <li>영문 소문자 포함</li>
                <li>숫자 포함</li>
                <li>특수문자 포함 (!@#$%^&* 등)</li>
                <li>&lt;, &gt;, &apos;, &quot; 사용 불가</li>
              </ul>
            </div>

            {/* 에러 메시지 */}
            {passwordErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordId(null); setNewPassword(''); setPasswordErrors([]) }}>
              취소
            </Button>
            <Button onClick={handleResetPassword} disabled={actionLoading || newPassword.length < 10}>
              {actionLoading ? '처리 중...' : '초기화'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
