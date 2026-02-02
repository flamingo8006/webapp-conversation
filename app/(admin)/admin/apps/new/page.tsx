'use client'

import { AppForm } from '@/app/components/admin/app-form'

export default function NewAppPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 챗봇 추가</h1>
        <p className="mt-2 text-gray-600">
          새로운 챗봇을 등록합니다
        </p>
      </div>

      <div className="max-w-3xl">
        <AppForm mode="create" />
      </div>
    </div>
  )
}
