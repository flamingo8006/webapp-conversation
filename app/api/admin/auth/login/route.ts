import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/admin-auth'
import { auditLogger } from '@/lib/audit-logger'
import { isIpAllowed, getClientIp } from '@/lib/ip-utils'
import { errorCapture } from '@/lib/error-capture'

export async function POST(request: NextRequest) {
  try {
    // Phase 9b: IP 화이트리스트 체크
    const clientIp = getClientIp(request.headers)
    const allowedIps = process.env.ADMIN_ALLOWED_IPS || ''

    if (!isIpAllowed(clientIp, allowedIps)) {
      await auditLogger.log({
        actorType: 'admin',
        actorId: null,
        actorLoginId: 'unknown',
        actorName: 'Unknown',
        action: 'LOGIN_BLOCKED_IP',
        entityType: 'Admin',
        entityId: null,
        success: false,
        errorMessage: `IP 차단: ${clientIp}`,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        requestPath: '/api/admin/auth/login',
      })

      return NextResponse.json(
        { error: '접근이 허용되지 않는 IP입니다.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { loginId, password } = body

    if (!loginId || !password) {
      return NextResponse.json(
        { error: '로그인 ID와 비밀번호를 입력해주세요.' },
        { status: 400 },
      )
    }

    const result = await authenticateAdmin(loginId, password, clientIp)

    if (!result.success) {
      // 로그인 실패 감사 로그
      await auditLogger.log({
        actorType: 'admin',
        actorId: null,
        actorLoginId: loginId,
        actorName: 'Unknown',
        action: result.locked ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
        entityType: 'Admin',
        entityId: null,
        success: false,
        errorMessage: result.error,
        metadata: {
          locked: result.locked,
          lockedUntil: result.lockedUntil,
          remainingAttempts: result.remainingAttempts,
        },
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent'),
        requestPath: '/api/admin/auth/login',
      })

      return NextResponse.json(
        {
          error: result.error,
          locked: result.locked,
          lockedUntil: result.lockedUntil,
        },
        { status: 401 },
      )
    }

    // 로그인 성공 감사 로그
    await auditLogger.log({
      actorType: 'admin',
      actorId: result.admin.id,
      actorLoginId: result.admin.loginId,
      actorName: result.admin.name,
      actorRole: result.admin.role,
      action: 'LOGIN',
      entityType: 'Admin',
      entityId: result.admin.id,
      success: true,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent'),
      requestPath: '/api/admin/auth/login',
    })

    // 쿠키에 토큰 설정
    const response = NextResponse.json({
      success: true,
      admin: result.admin,
    })

    response.cookies.set('admin_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8시간
      path: '/',
    })

    return response
  }
  catch (error) {
    console.error('Admin login error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
