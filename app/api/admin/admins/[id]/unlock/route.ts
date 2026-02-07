import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSuperAdmin, getActorInfo } from '@/lib/admin-auth'
import { adminRepository } from '@/lib/repositories/admin'
import { auditLogger } from '@/lib/audit-logger'
import { errorCapture } from '@/lib/error-capture'

/**
 * POST /api/admin/admins/:id/unlock
 * 계정 잠금 해제 (슈퍼관리자 전용)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireSuperAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 },
      )
    }

    const { id } = await params

    // 대상 관리자 조회
    const targetAdmin = await adminRepository.getAdminById(id)
    if (!targetAdmin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 },
      )
    }

    // 잠금 해제
    await adminRepository.unlockAccount(id, admin.sub)

    // 감사 로그
    await auditLogger.log({
      ...getActorInfo(admin),
      action: 'ADMIN_UNLOCK',
      entityType: 'Admin',
      entityId: id,
      metadata: {
        targetLoginId: targetAdmin.loginId,
        targetName: targetAdmin.name,
      },
      success: true,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: request.headers.get('user-agent'),
      requestPath: `/api/admin/admins/${id}/unlock`,
    })

    return NextResponse.json({
      success: true,
      message: '계정 잠금이 해제되었습니다.',
    })
  }
  catch (error) {
    console.error('Unlock admin error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '잠금 해제 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
