'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface Admin {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: string
  isActive: boolean
}

interface EditAdminPageProps {
  params: Promise<{ id: string }>
}

export default function EditAdminPage({ params }: EditAdminPageProps) {
  const { id } = use(params)
  const { admin: currentAdmin, isSuperAdmin } = useAdminAuth()
  const router = useRouter()

  const [admin, setAdmin] = useState<Admin | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isSelf = currentAdmin?.id === id

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin')
      return
    }

    const fetchAdmin = async () => {
      try {
        const response = await fetch(`/api/admin/admins/${id}`)
        if (response.ok) {
          const data = await response.json()
          setAdmin(data.admin)
          setName(data.admin.name)
          setEmail(data.admin.email || '')
          setDepartment(data.admin.department || '')
          setRole(data.admin.role)
          setIsActive(data.admin.isActive)
        }
        else {
          router.push('/admin/admins')
        }
      }
      catch {
        router.push('/admin/admins')
      }
      finally {
        setLoading(false)
      }
    }

    fetchAdmin()
  }, [id, isSuperAdmin, router])

  if (!isSuperAdmin || loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          department: department || undefined,
          role: isSelf ? undefined : role,
          isActive: isSelf ? undefined : isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '수정에 실패했습니다.')
        return
      }

      router.push('/admin/admins')
    }
    catch {
      setError('수정 중 오류가 발생했습니다.')
    }
    finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/admins">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">관리자 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          관리자 계정 정보를 수정합니다.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>관리자 정보</CardTitle>
          <CardDescription>
            {admin.loginId} 계정의 정보를 수정합니다.
            {isSelf && ' (본인 계정)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>로그인 ID</Label>
              <Input value={admin.loginId} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
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
              <Select
                value={role}
                onValueChange={v => setRole(v as 'admin' | 'super_admin')}
                disabled={isSelf}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="super_admin">슈퍼관리자</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && (
                <p className="text-xs text-amber-600">
                  본인의 역할은 변경할 수 없습니다.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>계정 활성화</Label>
                <p className="text-xs text-gray-500">
                  비활성화된 관리자는 로그인할 수 없습니다.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isSelf}
              />
            </div>
            {isSelf && (
              <p className="text-xs text-amber-600">
                본인 계정은 비활성화할 수 없습니다.
              </p>
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
