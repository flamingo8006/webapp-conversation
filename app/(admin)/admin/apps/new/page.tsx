'use client'

import { useEffect, useState } from 'react'
import { AppForm } from '@/app/components/admin/app-form'

interface AdminGroup {
  id: string
  name: string
}

export default function NewAppPage() {
  const [groups, setGroups] = useState<AdminGroup[]>([])

  useEffect(() => {
    fetch('/api/admin/groups')
      .then(res => res.ok ? res.json() : { groups: [] })
      .then(data => setGroups(
        (data.groups || []).filter((g: any) => g.isActive),
      ))
      .catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 챗봇 추가</h1>
        <p className="mt-2 text-gray-600">
          새로운 챗봇을 등록합니다
        </p>
      </div>

      <div className="max-w-3xl">
        <AppForm mode="create" groups={groups} />
      </div>
    </div>
  )
}
