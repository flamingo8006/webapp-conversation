'use client'

import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { AuthProvider } from './auth-provider'
import i18n from '@/i18n/i18next-config'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </I18nextProvider>
  )
}
