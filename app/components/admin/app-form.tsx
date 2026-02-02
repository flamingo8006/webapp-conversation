'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface AppFormProps {
  app?: AppConfig
  mode: 'create' | 'edit'
}

export function AppForm({ app, mode }: AppFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: app?.name || '',
    description: app?.description || '',
    difyAppId: app?.difyAppId || '',
    apiKey: '',
    apiUrl: app?.apiUrl || 'https://api.dify.ai/v1',
    iconUrl: app?.iconUrl || '',
    isActive: app?.isActive ?? true,
    sortOrder: app?.sortOrder || 0,
    // Phase 7: 공개 설정
    isPublic: app?.isPublic ?? false,
    requireAuth: app?.requireAuth ?? true,
    allowAnonymous: app?.allowAnonymous ?? false,
    maxAnonymousMsgs: app?.maxAnonymousMsgs || 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = mode === 'create'
        ? '/api/admin/apps'
        : `/api/admin/apps/${app?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      // API Key는 수정 모드에서 비어있으면 제외
      const payload: any = { ...formData }
      if (mode === 'edit' && !payload.apiKey) {
        delete payload.apiKey
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save app')
      }

      Toast.notify({
        type: 'success',
        message: mode === 'create' ? '챗봇이 생성되었습니다.' : '챗봇이 수정되었습니다.',
      })

      router.push('/admin/apps')
    }
    catch (error: any) {
      console.error('Failed to save app:', error)
      Toast.notify({
        type: 'error',
        message: error.message || '챗봇 저장에 실패했습니다.',
      })
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-medium mb-4">기본 정보</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  챗봇 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="예: 고객 지원 챗봇"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="챗봇에 대한 설명을 입력하세요"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dify 설정 */}
          <div>
            <h3 className="text-lg font-medium mb-4">Dify 설정</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difyAppId">
                  Dify App ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="difyAppId"
                  name="difyAppId"
                  required
                  value={formData.difyAppId}
                  onChange={handleChange}
                  placeholder="app-xxxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  API Key {mode === 'create' && <span className="text-destructive">*</span>}
                  {mode === 'edit' && <span className="text-muted-foreground text-xs ml-1">(변경 시에만 입력)</span>}
                </Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  required={mode === 'create'}
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder={mode === 'edit' ? '변경하지 않으려면 비워두세요' : 'app-xxxxxxxxxx'}
                />
                <p className="text-xs text-muted-foreground">
                  API Key는 암호화되어 저장됩니다
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  name="apiUrl"
                  type="url"
                  value={formData.apiUrl}
                  onChange={handleChange}
                  placeholder="https://api.dify.ai/v1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 추가 설정 */}
          <div>
            <h3 className="text-lg font-medium mb-4">추가 설정</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="iconUrl">아이콘 URL</Label>
                <Input
                  id="iconUrl"
                  name="iconUrl"
                  type="url"
                  value={formData.iconUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/icon.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">정렬 순서</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  숫자가 작을수록 먼저 표시됩니다
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleCheckboxChange('isActive', checked as boolean)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  활성화
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* 공개 설정 (Phase 7) */}
          <div>
            <h3 className="text-lg font-medium mb-4">공개 설정</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleCheckboxChange('isPublic', checked as boolean)}
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  공개 챗봇 (포털에 노출)
                </Label>
              </div>

              {formData.isPublic && (
                <Card className="ml-6 bg-muted/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requireAuth"
                        checked={formData.requireAuth}
                        onCheckedChange={(checked) => handleCheckboxChange('requireAuth', checked as boolean)}
                      />
                      <Label htmlFor="requireAuth" className="cursor-pointer">
                        인증 필수
                      </Label>
                    </div>

                    {!formData.requireAuth && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="allowAnonymous"
                            checked={formData.allowAnonymous}
                            onCheckedChange={(checked) => handleCheckboxChange('allowAnonymous', checked as boolean)}
                          />
                          <Label htmlFor="allowAnonymous" className="cursor-pointer">
                            익명 사용자 허용
                          </Label>
                        </div>

                        {formData.allowAnonymous && (
                          <div className="space-y-2">
                            <Label htmlFor="maxAnonymousMsgs">
                              익명 사용자 최대 메시지 수
                            </Label>
                            <Input
                              id="maxAnonymousMsgs"
                              name="maxAnonymousMsgs"
                              type="number"
                              min="0"
                              value={formData.maxAnonymousMsgs}
                              onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">
                              0이면 무제한
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          {/* 액션 버튼 */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? '저장 중...' : mode === 'create' ? '생성' : '수정'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
