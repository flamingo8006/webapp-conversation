import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAdminFromRequest, getActorInfo } from '@/lib/admin-auth'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (admin) {
      // 로그아웃 감사 로그
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown'

      await auditLogger.log({
        ...getActorInfo(admin),
        action: 'LOGOUT',
        entityType: 'Admin',
        entityId: admin.sub,
        success: true,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent'),
        requestPath: '/api/admin/auth/logout',
      })
    }

    const response = NextResponse.json({ success: true })

    // 쿠키 삭제
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  }
  catch (error) {
    logger.apiError(request, 'Admin logout error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
