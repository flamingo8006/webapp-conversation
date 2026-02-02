'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Toast from '@/app/components/base/toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      Toast.notify({
        type: 'success',
        message: `환영합니다, ${data.user.name}님!`,
      })

      // 리다이렉트
      router.push(redirect)
    }
    catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white shadow-lg rounded-lg px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DGIST AI 챗봇
          </h1>
          <p className="text-gray-600">로그인하여 계속하기</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="loginId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              로그인 ID
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="loginId를 입력하세요"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>테스트 계정:</p>
          <p className="mt-1">
            관리자: <code className="bg-gray-100 px-2 py-1 rounded">admin / admin123</code>
          </p>
          <p className="mt-1">
            사용자: <code className="bg-gray-100 px-2 py-1 rounded">user / user123</code>
          </p>
        </div>
      </div>
    </div>
  )
}
