'use client'

import { useAuth } from '@/hooks/use-auth'
import { AppList } from '@/app/components/portal/app-list'

export default function PortalPage() {
  const { user, loading } = useAuth()

  // Phase 7: 익명 사용자도 접근 가능하므로 로딩만 체크
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                DGIST AI 챗봇 포털
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                원하는 챗봇을 선택하여 대화를 시작하세요
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.loginId}</p>
                  </div>
                  {user.role === 'admin' && (
                    <a
                      href="/admin"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      관리자
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' })
                      window.location.href = '/login'
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <a
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  로그인
                </a>
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
