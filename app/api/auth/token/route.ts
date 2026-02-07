import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { errorCapture } from '@/lib/error-capture'

/**
 * POST /api/auth/token
 * URL 파라미터로 전달된 JWT 토큰을 검증하고 쿠키에 저장
 * Phase 9a: 레거시 시스템에서 리다이렉트 시 토큰 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 },
      )
    }

    // 토큰 검증
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      )
    }

    // 토큰을 쿠키에 저장
    const response = NextResponse.json({
      success: true,
      user: {
        empNo: payload.empNo,
        loginId: payload.sub,
        name: payload.name,
        role: payload.role,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1시간 (JWT 만료와 동일)
      path: '/',
    })

    return response
  }
  catch (error) {
    console.error('Token processing error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Failed to process token' },
      { status: 500 },
    )
  }
}
