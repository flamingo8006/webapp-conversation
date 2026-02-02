import type { ReactNode } from 'react'

interface EmbedLayoutProps {
  children: ReactNode
}

export default function EmbedLayout({ children }: EmbedLayoutProps) {
  return (
    <div className="h-full">
      {children}
    </div>
  )
}
