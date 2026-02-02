'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bot, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navigation = [
  { name: '대시보드', href: '/admin', icon: LayoutDashboard },
  { name: '챗봇 관리', href: '/admin/apps', icon: Bot },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white h-screen">
      {/* 로고 */}
      <div className="flex items-center h-16 px-6 bg-slate-800">
        <h1 className="text-xl font-bold">DGIST AI 관리자</h1>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="p-4 border-t border-slate-800">
        {user && (
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.loginId}</p>
            <p className="text-xs text-slate-500 mt-1">
              {user.role === 'admin' ? '관리자' : '사용자'}
            </p>
          </div>
        )}
        <Separator className="my-3 bg-slate-700" />
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              포털로 이동
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
