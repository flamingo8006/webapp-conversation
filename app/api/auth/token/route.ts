import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getJwtExpirySeconds, verifyToken } from '@/lib/jwt'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/token
 * JWT 토큰을 검증하고 쿠키에 저장
 *
 * 두 가지 Content-Type 지원:
 * 1. application/json → JSON 응답 (기존)
 * 2. application/x-www-form-urlencoded → 쿠키 설정 + 302 리다이렉트 (시나리오 1)
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  const isFormData = contentType.includes('application/x-www-form-urlencoded')

  try {
    let token: string | null = null

    if (isFormData) {
      const formData = await request.formData()
      token = formData.get('token') as string | null
    }
    else {
      const body = await request.json()
      token = body.token
    }

    if (!token) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
      }
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 },
      )
    }

    // 토큰 검증
    const payload = await verifyToken(token)

    if (!payload) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
      }
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      )
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: getJwtExpirySeconds(),
      path: '/',
    }

    if (isFormData) {
      // Form POST: 쿠키 설정 + 포털로 302 리다이렉트
      const response = NextResponse.redirect(new URL('/', request.url))
      response.cookies.set('auth_token', token, cookieOptions)
      return response
    }

    // JSON POST: 기존 동작 유지
    const response = NextResponse.json({
      success: true,
      user: {
        empNo: payload.empNo,
        loginId: payload.sub,
        name: payload.name,
        role: payload.role,
      },
    })

    response.cookies.set('auth_token', token, cookieOptions)
    return response
  }
  catch (error) {
    logger.apiError(request, 'Token processing error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    if (isFormData) {
      return NextResponse.redirect(new URL('/login?error=server_error', request.url))
    }
    return NextResponse.json(
      { error: 'Failed to process token' },
      { status: 500 },
    )
  }
}
