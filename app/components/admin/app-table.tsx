'use client'

import { useState } from 'react'
import Link from 'next/link'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'
import { PublishModal } from './publish-modal'

interface AppTableProps {
  apps: AppConfig[]
  onDelete: (appId: string) => void
}

export function AppTable({ apps, onDelete }: AppTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingApp, setPublishingApp] = useState<AppConfig | null>(null)

  const handleDelete = async (app: AppConfig) => {
    if (!confirm(`"${app.name}" 챗봇을 삭제하시겠습니까?`)) {
      return
    }

    setDeletingId(app.id)

    try {
      const response = await fetch(`/api/admin/apps/${app.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete app')
      }

      Toast.notify({
        type: 'success',
        message: '챗봇이 삭제되었습니다.',
      })

      onDelete(app.id)
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
    }
  }

  if (apps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">
          등록된 챗봇이 없습니다
        </p>
        <p className="text-gray-500 text-sm mb-6">
          새 챗봇을 추가하여 시작하세요
        </p>
        <Link
          href="/admin/apps/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <span className="mr-2">➕</span>
          새 챗봇 추가
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              챗봇 이름
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              설명
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              생성일
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              액션
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {apps.map(app => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {app.iconUrl ? (
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-10 h-10 rounded-lg mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.difyAppId}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {app.description || '-'}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  {app.isActive ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                      활성
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                      비활성
                    </span>
                  )}
                  {app.isPublic && (
                    <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                      공개
                    </span>
                  )}
                  {app.isPublic && app.allowAnonymous && (
                    <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">
                      익명 허용
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {app.createdAt ? new Date(app.createdAt).toLocaleDateString('ko-KR') : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setPublishingApp(app)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    게시하기
                  </button>
                  <Link
                    href={`/admin/apps/${app.id}/edit`}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => handleDelete(app)}
                    disabled={deletingId === app.id}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === app.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Publish Modal */}
      <PublishModal
        app={publishingApp!}
        isOpen={!!publishingApp}
        onClose={() => setPublishingApp(null)}
      />
    </div>
  )
}
