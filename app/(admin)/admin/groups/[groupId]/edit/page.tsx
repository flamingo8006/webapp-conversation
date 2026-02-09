'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, UserCog, Bot, X } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface GroupMember {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: string
  groupRole: string
  isActive: boolean
}

interface AvailableAdmin {
  id: string
  loginId: string
  name: string
  department: string | null
  groupId: string | null
}

interface GroupApp {
  id: string
  name: string
  nameKo: string | null
  nameEn: string | null
  difyAppId: string
  isPublic: boolean
  isActive: boolean
}

interface AvailableApp {
  id: string
  name: string
  nameKo: string | null
  groupId: string | null
}

export default function EditGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)
  const { isSuperAdmin } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<GroupMember[]>([])
  const [groupApps, setGroupApps] = useState<GroupApp[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 멤버 추가 다이얼로그
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableAdmins, setAvailableAdmins] = useState<AvailableAdmin[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [selectedGroupRole, setSelectedGroupRole] = useState<string>('member')
  const [addingMember, setAddingMember] = useState(false)

  // 챗봇 추가 다이얼로그
  const [showAddApp, setShowAddApp] = useState(false)
  const [availableApps, setAvailableApps] = useState<AvailableApp[]>([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [addingApp, setAddingApp] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push(adminPath())
      return
    }
    fetchGroup()
  }, [isSuperAdmin, router, groupId])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setName(data.name)
        setDescription(data.description || '')
        setMembers(data.members || [])
        setGroupApps(data.apps || [])
      }
      else {
        router.push(adminPath('/groups'))
      }
    }
    catch (error) {
      console.error('Failed to fetch group:', error)
      router.push(adminPath('/groups'))
    }
    finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('그룹 이름은 필수입니다.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '그룹 수정에 실패했습니다.')
        return
      }

      toast({ title: '그룹이 수정되었습니다.' })
    }
    catch {
      setError('그룹 수정 중 오류가 발생했습니다.')
    }
    finally {
      setSaving(false)
    }
  }

  const fetchAvailableAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins')
      if (response.ok) {
        const data = await response.json()
        // 그룹 미소속 관리자만 필터
        const available = data.admins.filter(
          (a: AvailableAdmin) => !a.groupId || a.groupId === groupId,
        )
        setAvailableAdmins(available)
      }
    }
    catch (error) {
      console.error('Failed to fetch admins:', error)
    }
  }

  const handleOpenAddMember = () => {
    fetchAvailableAdmins()
    setSelectedAdminId('')
    setSelectedGroupRole('member')
    setShowAddMember(true)
  }

  const handleAddMember = async () => {
    if (!selectedAdminId) { return }

    setAddingMember(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdminId,
          groupRole: selectedGroupRole,
        }),
      })

      if (response.ok) {
        toast({ title: '멤버가 추가되었습니다.' })
        setShowAddMember(false)
        await fetchGroup()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '멤버 추가에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to add member:', error)
      toast({ title: '멤버 추가 중 오류가 발생했습니다.', variant: 'destructive' })
    }
    finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/members/${adminId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ title: '멤버가 제거되었습니다.' })
        await fetchGroup()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '멤버 제거에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const fetchAvailableApps = async () => {
    try {
      const response = await fetch('/api/admin/apps')
      if (response.ok) {
        const data = await response.json()
        const apps = Array.isArray(data) ? data : (data.apps || [])
        const available = apps.filter(
          (a: AvailableApp) => !a.groupId,
        )
        setAvailableApps(available)
      }
    }
    catch (error) {
      console.error('Failed to fetch apps:', error)
    }
  }

  const handleOpenAddApp = () => {
    fetchAvailableApps()
    setSelectedAppId('')
    setShowAddApp(true)
  }

  const handleAddApp = async () => {
    if (!selectedAppId) { return }

    setAddingApp(true)
    try {
      const response = await fetch(`/api/admin/apps/${selectedAppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })

      if (response.ok) {
        toast({ title: '챗봇이 그룹에 배정되었습니다.' })
        setShowAddApp(false)
        await fetchGroup()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '챗봇 배정에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to add app:', error)
      toast({ title: '챗봇 배정 중 오류가 발생했습니다.', variant: 'destructive' })
    }
    finally {
      setAddingApp(false)
    }
  }

  const handleRemoveApp = async (appId: string) => {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: null }),
      })

      if (response.ok) {
        toast({ title: '챗봇이 그룹에서 해제되었습니다.' })
        await fetchGroup()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '챗봇 해제에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to remove app:', error)
    }
  }

  const handleChangeRole = async (adminId: string, groupRole: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/members/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupRole }),
      })

      if (response.ok) {
        toast({ title: '역할이 변경되었습니다.' })
        await fetchGroup()
      }
      else {
        const data = await response.json()
        toast({ title: data.error || '역할 변경에 실패했습니다.', variant: 'destructive' })
      }
    }
    catch (error) {
      console.error('Failed to change role:', error)
    }
  }

  if (!isSuperAdmin || loading) {
    return loading ? <div className="p-8 text-center text-gray-500">로딩 중...</div> : null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={adminPath('/groups')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">그룹 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          그룹 정보를 수정하고 멤버를 관리합니다.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* 그룹 정보 수정 */}
        <Card>
          <CardHeader>
            <CardTitle>그룹 정보</CardTitle>
            <CardDescription>그룹의 기본 정보를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">그룹 이름 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* 멤버 관리 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>멤버 관리</CardTitle>
                <CardDescription>그룹에 소속된 관리자를 관리합니다.</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddMember}>
                <Plus className="mr-2 h-4 w-4" />
                멤버 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">소속 멤버가 없습니다.</div>
              )
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>로그인 ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>부서</TableHead>
                      <TableHead>시스템 역할</TableHead>
                      <TableHead>그룹 역할</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.loginId}</TableCell>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'super_admin' ? 'default' : 'secondary'}>
                            {member.role === 'super_admin' ? '슈퍼관리자' : '관리자'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.groupRole}
                            onValueChange={v => handleChangeRole(member.id, v)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="group_admin">그룹 관리자</SelectItem>
                              <SelectItem value="member">멤버</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>

        <Separator />

        {/* 소속 챗봇 관리 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>소속 챗봇</CardTitle>
                <CardDescription>그룹에 배정된 챗봇을 관리합니다.</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenAddApp}>
                <Plus className="mr-2 h-4 w-4" />
                챗봇 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {groupApps.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">배정된 챗봇이 없습니다.</div>
              )
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>챗봇 이름</TableHead>
                      <TableHead>한글 이름</TableHead>
                      <TableHead>Dify App ID</TableHead>
                      <TableHead>공개</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupApps.map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.nameKo || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{app.difyAppId}</TableCell>
                        <TableCell>
                          {app.isPublic
                            ? <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">공개</Badge>
                            : <Badge variant="secondary">비공개</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveApp(app.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            해제
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>

      {/* 멤버 추가 다이얼로그 */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 추가</DialogTitle>
            <DialogDescription>
              그룹에 추가할 관리자를 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>관리자 선택</Label>
              <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                <SelectTrigger>
                  <SelectValue placeholder="관리자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableAdmins
                    .filter(a => !members.some(m => m.id === a.id))
                    .map(admin => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} ({admin.loginId}){admin.department ? ` - ${admin.department}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>그룹 역할</Label>
              <Select value={selectedGroupRole} onValueChange={setSelectedGroupRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group_admin">그룹 관리자</SelectItem>
                  <SelectItem value="member">멤버</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                그룹 관리자는 그룹 내 챗봇을 관리할 수 있습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              취소
            </Button>
            <Button onClick={handleAddMember} disabled={addingMember || !selectedAdminId}>
              <UserCog className="mr-2 h-4 w-4" />
              {addingMember ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 챗봇 추가 다이얼로그 */}
      <Dialog open={showAddApp} onOpenChange={setShowAddApp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>챗봇 배정</DialogTitle>
            <DialogDescription>
              그룹에 배정할 챗봇을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>챗봇 선택</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="챗봇을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableApps.map(app => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.nameKo || app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddApp(false)}>
              취소
            </Button>
            <Button onClick={handleAddApp} disabled={addingApp || !selectedAppId}>
              <Bot className="mr-2 h-4 w-4" />
              {addingApp ? '배정 중...' : '배정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
