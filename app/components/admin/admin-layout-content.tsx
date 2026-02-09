'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'
import { AdminSidebar } from './sidebar'

interface AdminLayoutContentProps {
  children: ReactNode
}

export function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !admin) {
      router.push(adminPath('/login'))
    }
  }, [admin, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
