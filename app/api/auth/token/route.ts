import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getJwtExpirySeconds, verifyToken } from '@/lib/jwt'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

/**
 * 쿠키 옵션 생성 헬퍼
 */
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: getJwtExpirySeconds(),
    path: '/',
  }
}

/**
 * 요청의 Host 헤더 기반으로 절대 URL 생성
 * Next.js dev 서버에서 request.url이 localhost를 사용하는 문제 방지
 */
function buildRedirectUrl(path: string, request: NextRequest): URL {
  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || 'http'
    return new URL(path, `${proto}://${host}`)
  }
  return new URL(path, request.url)
}

/**
 * 토큰 검증 + 쿠키 설정 + 리다이렉트 공통 로직
 */
async function handleTokenRedirect(token: string, request: NextRequest) {
  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.redirect(buildRedirectUrl('/login?error=invalid_token', request), 302)
  }

  const response = NextResponse.redirect(buildRedirectUrl('/', request), 302)
  response.cookies.set('auth_token', token, getCookieOptions())
  return response
}

/**
 * GET /api/auth/token?token=...
 * 브라우저 리다이렉트 방식: 쿼리 파라미터로 토큰 전달
 *
 * 레거시 시스템에서 사용자의 브라우저를 302 리다이렉트로 보내는 경우 사용.
 * 예: Location: https://ask.dgist.ac.kr/api/auth/token?token=eyJ...
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(buildRedirectUrl('/login?error=missing_token', request), 302)
    }

    return await handleTokenRedirect(token, request)
  }
  catch (error) {
    logger.apiError(request, 'Token GET processing error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.redirect(buildRedirectUrl('/login?error=server_error', request), 302)
  }
}

/**
 * POST /api/auth/token
 * JWT 토큰을 검증하고 쿠키에 저장
 *
 * 세 가지 Content-Type 지원:
 * 1. application/json → JSON 응답 (포털 페이지의 ?token= 파라미터 처리용)
 * 2. application/x-www-form-urlencoded → 쿠키 설정 + 302 리다이렉트 (시나리오 1 auto-submit form)
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
        return NextResponse.redirect(buildRedirectUrl('/login?error=missing_token', request), 302)
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
        return NextResponse.redirect(buildRedirectUrl('/login?error=invalid_token', request), 302)
      }
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      )
    }

    const cookieOptions = getCookieOptions()

    if (isFormData) {
      // Form POST: 쿠키 설정 + 포털로 302 리다이렉트 (PRG 패턴)
      const response = NextResponse.redirect(buildRedirectUrl('/', request), 302)
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
      return NextResponse.redirect(buildRedirectUrl('/login?error=server_error', request), 302)
    }
    return NextResponse.json(
      { error: 'Failed to process token' },
      { status: 500 },
    )
  }
}
