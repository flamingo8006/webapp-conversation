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
import { Card, CardContent } from '@/components/ui/card'
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
    // 다국어 필드 (Phase 8a-2)
    nameKo: app?.nameKo || '',
    nameEn: app?.nameEn || '',
    descriptionKo: app?.descriptionKo || '',
    descriptionEn: app?.descriptionEn || '',
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
              {/* 레거시 이름 (내부용) */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  시스템 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="예: customer-support-bot"
                />
                <p className="text-xs text-muted-foreground">
                  내부 관리용 이름입니다. 사용자에게는 표시되지 않습니다.
                </p>
              </div>

              {/* 다국어 이름 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameKo">한글 이름</Label>
                  <Input
                    id="nameKo"
                    name="nameKo"
                    value={formData.nameKo}
                    onChange={handleChange}
                    placeholder="예: 고객 지원 챗봇"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">영어 이름</Label>
                  <Input
                    id="nameEn"
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    placeholder="예: Customer Support Bot"
                  />
                </div>
              </div>

              {/* 레거시 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">시스템 설명</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="내부 관리용 설명 (선택사항)"
                />
              </div>

              {/* 다국어 설명 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionKo">한글 설명</Label>
                  <Textarea
                    id="descriptionKo"
                    name="descriptionKo"
                    rows={3}
                    value={formData.descriptionKo}
                    onChange={handleChange}
                    placeholder="챗봇에 대한 한글 설명을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">영어 설명</Label>
                  <Textarea
                    id="descriptionEn"
                    name="descriptionEn"
                    rows={3}
                    value={formData.descriptionEn}
                    onChange={handleChange}
                    placeholder="Enter description in English"
                  />
                </div>
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
                  onCheckedChange={checked => handleCheckboxChange('isActive', checked as boolean)}
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
            <h3 className="text-lg font-medium mb-4">접근 설정</h3>
            <div className="space-y-4">
              {/* 포털 노출 설정 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={checked => handleCheckboxChange('isPublic', checked as boolean)}
                  />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    포털에 노출
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  체크하면 메인 포털 페이지의 챗봇 목록에 표시됩니다. 체크하지 않으면 직접 URL로만 접근 가능합니다.
                </p>
              </div>

              {formData.isPublic && (
                <Card className="ml-6 bg-muted/50">
                  <CardContent className="p-4 space-y-4">
                    {/* 인증 필수 설정 */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireAuth"
                          checked={formData.requireAuth}
                          onCheckedChange={checked => handleCheckboxChange('requireAuth', checked as boolean)}
                        />
                        <Label htmlFor="requireAuth" className="cursor-pointer">
                          로그인 필수
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        체크하면 로그인한 사용자만 이 챗봇을 사용할 수 있습니다.
                      </p>
                    </div>

                    {!formData.requireAuth && (
                      <>
                        {/* 익명 사용자 허용 설정 */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowAnonymous"
                              checked={formData.allowAnonymous}
                              onCheckedChange={checked => handleCheckboxChange('allowAnonymous', checked as boolean)}
                            />
                            <Label htmlFor="allowAnonymous" className="cursor-pointer">
                              익명 사용자 허용
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            체크하면 로그인하지 않은 사용자도 이 챗봇을 사용할 수 있습니다. 세션 ID로 대화가 관리됩니다.
                          </p>
                        </div>

                        {formData.allowAnonymous && (
                          <div className="space-y-2 ml-6">
                            <Label htmlFor="maxAnonymousMsgs">
                              익명 사용자 메시지 제한
                            </Label>
                            <Input
                              id="maxAnonymousMsgs"
                              name="maxAnonymousMsgs"
                              type="number"
                              min="0"
                              value={formData.maxAnonymousMsgs}
                              onChange={handleChange}
                              className="max-w-[200px]"
                            />
                            <p className="text-xs text-muted-foreground">
                              익명 사용자가 보낼 수 있는 최대 메시지 수입니다. 0이면 무제한입니다.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 비공개 챗봇 안내 */}
              {!formData.isPublic && (
                <Card className="ml-6 bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      이 챗봇은 포털에 노출되지 않습니다. 로그인한 사용자만 직접 URL 또는 임베드 코드를 통해 접근할 수 있습니다.
                    </p>
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
