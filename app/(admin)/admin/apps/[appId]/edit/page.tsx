'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppForm } from '@/app/components/admin/app-form'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'
import { adminPath } from '@/lib/admin-path'

interface AdminGroup {
  id: string
  name: string
}

export default function EditAppPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

  const [app, setApp] = useState<AppConfig | null>(null)
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApp()
    fetchGroups()
  }, [appId])

  const fetchApp = async () => {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`)

      if (!response.ok) {
        if (response.status === 404) {
          Toast.notify({
            type: 'error',
            message: '챗봇을 찾을 수 없습니다.',
          })
          router.push(adminPath('/apps'))
          return
        }
        throw new Error('Failed to fetch app')
      }

      const data = await response.json()
      setApp(data)
    }
    catch (error) {
      console.error('Failed to fetch app:', error)
      Toast.notify({
        type: 'error',
        message: '챗봇 정보를 불러오는데 실패했습니다.',
      })
      router.push(adminPath('/apps'))
    }
    finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups')
      if (res.ok) {
        const data = await res.json()
        setGroups((data.groups || []).filter((g: any) => g.isActive))
      }
    }
    catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">챗봇 수정</h1>
        <p className="mt-2 text-gray-600">
          {app.name}
        </p>
      </div>

      <div className="max-w-3xl">
        <AppForm app={app} mode="edit" groups={groups} />
      </div>
    </div>
  )
}
