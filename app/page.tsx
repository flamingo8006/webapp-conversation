'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LogOut, Settings, Loader2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { adminPath } from '@/lib/admin-path'
import { AppList } from '@/app/components/portal/app-list'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import LanguageSwitcher from '@/app/components/language-switcher'
import Toast from '@/app/components/base/toast'

export default function PortalPage() {
  const { t } = useTranslation()
  const { user, loading, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tokenProcessing, setTokenProcessing] = useState(false)

  // Phase 9a: URL 파라미터로 토큰 전달 시 처리 (레거시 시스템 연동)
  useEffect(() => {
    const token = searchParams.get('token')
    if (token && !user && !loading) {
      setTokenProcessing(true)
      // 토큰을 쿠키에 저장하는 API 호출
      fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            Toast.notify({
              type: 'success',
              message: `${t('common.welcome')}, ${data.user?.name || ''}!`,
            })
            await refreshUser()
            // URL에서 토큰 파라미터 제거
            router.replace('/')
          }
          else {
            const error = await res.json()
            Toast.notify({
              type: 'error',
              message: error.error || t('app.portal.tokenInvalid'),
            })
          }
        })
        .catch((err) => {
          console.error('Token processing error:', err)
          Toast.notify({
            type: 'error',
            message: t('app.portal.tokenError'),
          })
        })
        .finally(() => {
          setTokenProcessing(false)
        })
    }
  }, [searchParams, user, loading, refreshUser, router, t])

  // 브라우저 탭 제목 다국어 설정
  useEffect(() => {
    document.title = t('app.portal.title')
  }, [t])

  // Phase 7: 익명 사용자도 접근 가능하므로 로딩만 체크
  if (loading || tokenProcessing) {
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
                {t('app.portal.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('app.portal.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user
                ? (
                  <>
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.loginId}</p>
                    </div>
                    {user.role === 'admin' && (
                      <Button asChild>
                        <Link href={adminPath()}>
                          <Settings className="mr-2 h-4 w-4" />
                          {t('app.portal.adminBtn')}
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' })
                        window.location.href = '/'
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('app.portal.logoutBtn')}
                    </Button>
                  </>
                )
                : (
                  // Phase 9a: 익명 사용자에게 안내 메시지 표시 (로그인 버튼 제거)
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {t('app.portal.guestMode')}
                    </p>
                  </div>
                )}

              {/* 언어 선택 버튼 (아이콘 클릭 방식) */}
              <LanguageSwitcher variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* 익명 사용자 안내 배너 */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('app.portal.guestNotice')}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AppList />
      </main>
    </div>
  )
}
