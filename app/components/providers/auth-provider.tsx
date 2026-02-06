'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/verify')

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
      else {
        // 401은 익명 사용자에게 정상 응답이므로 조용히 처리
        setUser(null)
      }
    }
    catch (error) {
      // 네트워크 에러만 로그
      if (!(error instanceof TypeError)) {
        console.error('Failed to fetch user:', error)
      }
      setUser(null)
    }
    finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
    }
    catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshUser = async () => {
    setLoading(true)
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
