'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AdminAuthProvider } from '@/app/components/providers/admin-auth-provider'
import { adminPath } from '@/lib/admin-path'
import { AdminLayoutContent } from '@/app/components/admin/admin-layout-content'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  // 로그인 페이지는 레이아웃 없이 렌더링
  if (pathname === adminPath('/login') || pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <AdminAuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminAuthProvider>
  )
}
