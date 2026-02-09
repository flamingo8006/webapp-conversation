'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Inbox, Loader2 } from 'lucide-react'
import Toast from '@/app/components/base/toast'
import { adminPath } from '@/lib/admin-path'
import type { AppConfig } from '@/hooks/use-app'
import { PublishModal } from './publish-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface AppTableProps {
  apps: AppConfig[]
  onDelete: (appId: string) => void
}

export function AppTable({ apps, onDelete }: AppTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppConfig | null>(null)
  const [publishingApp, setPublishingApp] = useState<AppConfig | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) { return }

    setDeletingId(deleteTarget.id)

    try {
      const response = await fetch(`/api/admin/apps/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete app')
      }

      Toast.notify({
        type: 'success',
        message: '챗봇이 삭제되었습니다.',
      })

      onDelete(deleteTarget.id)
    }
    catch (error) {
      console.error('Failed to delete app:', error)
      Toast.notify({
        type: 'error',
        message: '챗봇 삭제에 실패했습니다.',
      })
    }
    finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            <Inbox className="w-16 h-16 mx-auto" strokeWidth={1.5} />
          </div>
          <p className="text-foreground text-lg font-medium mb-2">
            등록된 챗봇이 없습니다
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            새 챗봇을 추가하여 시작하세요
          </p>
          <Button asChild>
            <Link href={adminPath('/apps/new')}>
              <Plus className="mr-2 h-4 w-4" />
              새 챗봇 추가
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>챗봇 이름</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map(app => (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex items-center">
                    {app.iconUrl
                      ? (
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-10 h-10 rounded-lg mr-3"
                        />
                      )
                      : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.difyAppId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.description || '-'}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {(app as any).group?.name || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {app.isActive
                      ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          활성
                        </Badge>
                      )
                      : (
                        <Badge variant="secondary">
                          비활성
                        </Badge>
                      )}
                    {app.isPublic && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        공개
                      </Badge>
                    )}
                    {app.isPublic && app.allowAnonymous && (
                      <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        익명 허용
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString('ko-KR') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPublishingApp(app)}
                    >
                      게시하기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/apps/${app.id}/edit`}>
                        수정
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(app)}
                      disabled={deletingId === app.id}
                    >
                      {deletingId === app.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      삭제
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>챗봇 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" 챗봇을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Modal */}
      <PublishModal
        app={publishingApp!}
        isOpen={!!publishingApp}
        onClose={() => setPublishingApp(null)}
      />
    </>
  )
}
