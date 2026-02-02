import type { ReactNode } from 'react'

interface PortalLayoutProps {
  children: ReactNode
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  return <>{children}</>
}
