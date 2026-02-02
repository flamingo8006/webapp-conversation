'use client'

import Link from 'next/link'
import { LogOut, Settings, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { AppList } from '@/app/components/portal/app-list'
import { Button } from '@/components/ui/button'

export default function PortalPage() {
  const { user, loading } = useAuth()

  // Phase 7: 익명 사용자도 접근 가능하므로 로딩만 체크
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                DGIST AI 챗봇 포털
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                원하는 챗봇을 선택하여 대화를 시작하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.loginId}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Button asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        관리자
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' })
                      window.location.href = '/login'
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/login">로그인</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AppList />
      </main>
    </div>
  )
}
