'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'

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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                챗봇 이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 고객 지원 챗봇"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="챗봇에 대한 설명을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* Dify 설정 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dify 설정</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="difyAppId" className="block text-sm font-medium text-gray-700 mb-1">
                Dify App ID <span className="text-red-500">*</span>
              </label>
              <input
                id="difyAppId"
                name="difyAppId"
                type="text"
                required
                value={formData.difyAppId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="app-xxxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                API Key {mode === 'create' && <span className="text-red-500">*</span>}
                {mode === 'edit' && <span className="text-gray-500 text-xs">(변경 시에만 입력)</span>}
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                required={mode === 'create'}
                value={formData.apiKey}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={mode === 'edit' ? '변경하지 않으려면 비워두세요' : 'app-xxxxxxxxxx'}
              />
              <p className="mt-1 text-xs text-gray-500">
                API Key는 암호화되어 저장됩니다
              </p>
            </div>

            <div>
              <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">
                API URL
              </label>
              <input
                id="apiUrl"
                name="apiUrl"
                type="url"
                value={formData.apiUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.dify.ai/v1"
              />
            </div>
          </div>
        </div>

        {/* 추가 설정 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">추가 설정</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="iconUrl" className="block text-sm font-medium text-gray-700 mb-1">
                아이콘 URL
              </label>
              <input
                id="iconUrl"
                name="iconUrl"
                type="url"
                value={formData.iconUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                정렬 순서
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                숫자가 작을수록 먼저 표시됩니다
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                활성화
              </label>
            </div>
          </div>
        </div>

        {/* 공개 설정 (Phase 7) */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">공개 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                공개 챗봇 (포털에 노출)
              </label>
            </div>

            {formData.isPublic && (
              <>
                <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <input
                      id="requireAuth"
                      name="requireAuth"
                      type="checkbox"
                      checked={formData.requireAuth}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireAuth" className="ml-2 block text-sm text-gray-900">
                      인증 필수
                    </label>
                  </div>

                  {!formData.requireAuth && (
                    <>
                      <div className="flex items-center">
                        <input
                          id="allowAnonymous"
                          name="allowAnonymous"
                          type="checkbox"
                          checked={formData.allowAnonymous}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowAnonymous" className="ml-2 block text-sm text-gray-900">
                          익명 사용자 허용
                        </label>
                      </div>

                      {formData.allowAnonymous && (
                        <div>
                          <label htmlFor="maxAnonymousMsgs" className="block text-sm font-medium text-gray-700 mb-1">
                            익명 사용자 최대 메시지 수
                          </label>
                          <input
                            id="maxAnonymousMsgs"
                            name="maxAnonymousMsgs"
                            type="number"
                            min="0"
                            value={formData.maxAnonymousMsgs}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            0이면 무제한
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : mode === 'create' ? '생성' : '수정'}
          </button>
        </div>
      </div>
    </form>
  )
}
