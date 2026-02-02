'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: '대시보드', href: '/admin', icon: '📊' },
  { name: '챗봇 관리', href: '/admin/apps', icon: '🤖' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      {/* 로고 */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <h1 className="text-xl font-bold">DGIST AI 관리자</h1>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="p-4 border-t border-gray-800">
        {user && (
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-400">{user.loginId}</p>
            <p className="text-xs text-gray-500 mt-1">
              {user.role === 'admin' ? '관리자' : '사용자'}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <Link
            href="/"
            className="block w-full px-4 py-2 text-sm text-center text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            포털로 이동
          </Link>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-center text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
