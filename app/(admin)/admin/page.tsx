'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalApps: 0,
    activeApps: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/apps')
      if (response.ok) {
        const apps = await response.json()
        setStats({
          totalApps: apps.length,
          activeApps: apps.filter((app: any) => app.isActive).length,
        })
      }
    }
    catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="mt-2 text-gray-600">DGIST AI 챗봇 플랫폼 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 챗봇</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApps}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 챗봇</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeApps}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <span className="text-2xl">⏸️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">비활성 챗봇</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalApps - stats.activeApps}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/apps/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-gray-900">새 챗봇 추가</p>
              <p className="text-sm text-gray-600">새로운 챗봇을 등록합니다</p>
            </div>
          </Link>

          <Link
            href="/admin/apps"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mr-3">📋</span>
            <div>
              <p className="font-medium text-gray-900">챗봇 관리</p>
              <p className="text-sm text-gray-600">등록된 챗봇을 관리합니다</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
