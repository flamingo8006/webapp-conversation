'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

export interface AppConfig {
  id: string
  name: string
  description: string | null
  // 다국어 필드 (Phase 8a-2)
  nameKo?: string | null
  nameEn?: string | null
  descriptionKo?: string | null
  descriptionEn?: string | null
  difyAppId: string
  apiUrl: string
  iconUrl: string | null
  isActive?: boolean
  sortOrder?: number
  createdAt?: Date | string
  // Phase 7: 공개 설정
  isPublic?: boolean
  requireAuth?: boolean
  allowAnonymous?: boolean
  maxAnonymousMsgs?: number | null
}

interface AppContextValue {
  app: AppConfig | null
  loading: boolean
  setApp: (app: AppConfig | null) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
  initialApp?: AppConfig | null
}

export function AppProvider({ children, initialApp = null }: AppProviderProps) {
  const [app, setApp] = useState<AppConfig | null>(initialApp)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialApp) {
      setApp(initialApp)
    }
  }, [initialApp])

  return (
    <AppContext.Provider value={{ app, loading, setApp }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
