'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminUser {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: 'super_admin' | 'admin'
  isActive: boolean
  lastLoginAt: string | null
}

interface AdminAuthContextValue {
  admin: AdminUser | null
  loading: boolean
  logout: () => Promise<void>
  refreshAdmin: () => Promise<void>
  isSuperAdmin: boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchAdmin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/me')

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
      }
      else {
        setAdmin(null)
      }
    }
    catch {
      setAdmin(null)
    }
    finally {
      setLoading(false)
    }
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      setAdmin(null)
      router.push('/admin/login')
    }
    catch (error) {
      console.error('Admin logout error:', error)
    }
  }

  const refreshAdmin = async () => {
    setLoading(true)
    await fetchAdmin()
  }

  useEffect(() => {
    fetchAdmin()
  }, [fetchAdmin])

  const isSuperAdmin = admin?.role === 'super_admin'

  return (
    <AdminAuthContext.Provider value={{ admin, loading, logout, refreshAdmin, isSuperAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
