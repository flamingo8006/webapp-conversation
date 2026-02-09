'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AdminGroup {
  id: string
  name: string
}

export default function NewAdminPage() {
  const { isSuperAdmin } = useAdminAuth()
  const router = useRouter()

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/groups')
      .then(res => res.ok ? res.json() : { groups: [] })
      .then(data => setGroups((data.groups || []).filter((g: any) => g.isActive)))
      .catch(() => {})
  }, [])

  if (!isSuperAdmin) {
    router.push(adminPath())
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId,
          password,
          name,
          email: email || undefined,
          department: department || undefined,
          role,
          groupId: groupId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '관리자 생성에 실패했습니다.')
        return
      }

      router.push(adminPath('/admins'))
    }
    catch {
      setError('관리자 생성 중 오류가 발생했습니다.')
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={adminPath('/admins')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">관리자 추가</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 관리자 계정을 생성합니다.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>관리자 정보</CardTitle>
          <CardDescription>
            관리자 계정에 필요한 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginId">로그인 ID *</Label>
              <Input
                id="loginId"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="영문, 숫자 조합"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="관리자 이름"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@dgist.ac.kr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">부서</Label>
              <Input
                id="department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="소속 부서"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">역할 *</Label>
              <Select value={role} onValueChange={v => setRole(v as 'admin' | 'super_admin')}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="super_admin">슈퍼관리자</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                슈퍼관리자는 다른 관리자 계정을 관리할 수 있습니다.
              </p>
            </div>

            {groups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="groupId">소속 그룹</Label>
                <Select value={groupId} onValueChange={v => setGroupId(v === '_none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="그룹 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">없음</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
