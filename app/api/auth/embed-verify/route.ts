import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getJwtExpirySeconds, signToken } from '@/lib/jwt'
import { verifyEmbedSignature } from '@/lib/hmac'
import { verifyUserWithLegacy } from '@/lib/legacy-auth'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/embed-verify
 * HMAC 서명 검증 + 레거시 사용자 확인 → JWT 발급
 * 시나리오 3: 인증형 임베드
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loginId, empNo, name, ts, sig } = body

    if (!loginId || !empNo || !name || !ts || !sig) {
      return NextResponse.json(
        { error: 'loginId, empNo, name, ts, sig are required' },
        { status: 400 },
      )
    }

    // 1. HMAC 서명 검증
    const signatureResult = verifyEmbedSignature({ loginId, empNo, name, ts, sig })
    if (!signatureResult.valid) {
      logger.apiWarn(request, 'Embed HMAC verification failed', {
        loginId,
        empNo,
        reason: signatureResult.error,
      })
      return NextResponse.json(
        { error: signatureResult.error || 'Invalid signature' },
        { status: 401 },
      )
    }

    // 2. 레거시 사용자 확인
    const verifyResult = await verifyUserWithLegacy(loginId, empNo)
    if (!verifyResult.success) {
      logger.apiWarn(request, 'Embed user verification failed', {
        loginId,
        empNo,
        reason: verifyResult.error,
      })
      return NextResponse.json(
        { error: verifyResult.error || 'User verification failed' },
        { status: 401 },
      )
    }

    const userData = verifyResult.data!

    // 3. JWT 발급
    const token = await signToken({
      sub: userData.loginId,
      empNo: userData.empNo,
      name: userData.name,
      role: userData.role,
    })

    // 4. 감사 로그 기록 (fire-and-forget)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    auditLogger.logCreate(
      { type: 'user', loginId: userData.loginId, name: userData.name, role: userData.role },
      'EMBED_AUTH',
      userData.empNo,
      { method: 'hmac', loginId: userData.loginId },
      { ip, userAgent: request.headers.get('user-agent') || undefined, path: '/api/auth/embed-verify' },
    ).catch(() => {})

    // 5. 쿠키 설정 + 응답
    const response = NextResponse.json({
      success: true,
      user: {
        empNo: userData.empNo,
        loginId: userData.loginId,
        name: userData.name,
        role: userData.role,
      },
    })

    response.cookies.set('embed_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: getJwtExpirySeconds(),
      path: '/',
    })

    return response
  }
  catch (error) {
    logger.apiError(request, 'Embed verify error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
