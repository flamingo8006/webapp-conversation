'use client'

import { useState } from 'react'
import { User, Key, Save } from 'lucide-react'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AdminProfilePage() {
  const { admin, refreshAdmin } = useAdminAuth()

  // 프로필 수정 상태
  const [name, setName] = useState(admin?.name || '')
  const [email, setEmail] = useState(admin?.email || '')
  const [department, setDepartment] = useState(admin?.department || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage(null)

    try {
      const response = await fetch('/api/admin/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department }),
      })

      const data = await response.json()

      if (!response.ok) {
        setProfileMessage({ type: 'error', text: data.error || '정보 수정에 실패했습니다.' })
        return
      }

      setProfileMessage({ type: 'success', text: '정보가 수정되었습니다.' })
      await refreshAdmin()
    }
    catch {
      setProfileMessage({ type: 'error', text: '정보 수정 중 오류가 발생했습니다.' })
    }
    finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      setPasswordSaving(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호는 8자 이상이어야 합니다.' })
      setPasswordSaving(false)
      return
    }

    try {
      const response = await fetch('/api/admin/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordMessage({ type: 'error', text: data.error || '비밀번호 변경에 실패했습니다.' })
        return
      }

      setPasswordMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    catch {
      setPasswordMessage({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' })
    }
    finally {
      setPasswordSaving(false)
    }
  }

  if (!admin)
  { return null }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>
        <p className="mt-1 text-sm text-gray-500">
          프로필 정보 및 비밀번호를 관리합니다.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* 프로필 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              프로필 정보
            </CardTitle>
            <CardDescription>
              기본 정보를 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>로그인 ID</Label>
                <Input value={admin.loginId} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label>역할</Label>
                <Input
                  value={admin.role === 'super_admin' ? '슈퍼관리자' : '관리자'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
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

              {profileMessage && (
                <div className={`p-3 text-sm rounded-lg ${
                  profileMessage.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <Button type="submit" disabled={profileSaving}>
                <Save className="mr-2 h-4 w-4" />
                {profileSaving ? '저장 중...' : '저장'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              비밀번호 변경
            </CardTitle>
            <CardDescription>
              보안을 위해 주기적으로 비밀번호를 변경하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {passwordMessage && (
                <div className={`p-3 text-sm rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <Button type="submit" disabled={passwordSaving}>
                <Key className="mr-2 h-4 w-4" />
                {passwordSaving ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
