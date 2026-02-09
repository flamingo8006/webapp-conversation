import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { adminRepository, type AdminPublic, type AdminWithPassword } from './repositories/admin'

// 관리자 JWT Payload 타입
export interface AdminJWTPayload {
  sub: string // admin.id
  loginId: string
  name: string
  role: 'super_admin' | 'admin'
  groupId: string | null // Phase 14
  groupRole: string // Phase 14
  type: 'admin' // 일반 사용자 JWT와 구분
  iat: number
  exp: number
  iss: string
  aud: string
}

// 로그인 결과 타입
export interface AuthenticateResult {
  success: true
  admin: AdminPublic
  token: string
}

export interface AuthenticateError {
  success: false
  error: string
  locked?: boolean
  lockedUntil?: Date | null
  remainingAttempts?: number
}

const getPublicKey = async () => {
  const publicKeyPem = process.env.JWT_PUBLIC_KEY!
  return await importSPKI(publicKeyPem, 'RS256')
}

const getPrivateKey = async () => {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY!
  return await importPKCS8(privateKeyPem, 'RS256')
}

// 관리자 JWT 발급
export async function signAdminToken(admin: AdminPublic): Promise<string> {
  const privateKey = await getPrivateKey()

  const token = await new SignJWT({
    sub: admin.id,
    loginId: admin.loginId,
    name: admin.name,
    role: admin.role,
    groupId: admin.groupId || null,
    groupRole: admin.groupRole || 'member',
    type: 'admin',
  } as any)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .setIssuer(process.env.JWT_ISSUER || 'dgist-auth')
    .setAudience(process.env.JWT_AUDIENCE || 'dgist-chatbot')
    .sign(privateKey)

  return token
}

// 관리자 JWT 검증
export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const publicKey = await getPublicKey()

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: process.env.JWT_ISSUER || 'dgist-auth',
      audience: process.env.JWT_AUDIENCE || 'dgist-chatbot',
    })

    // type이 'admin'인지 확인
    if ((payload as any).type !== 'admin') {
      return null
    }

    return payload as unknown as AdminJWTPayload
  }
  catch (error) {
    logger.error('Admin JWT verification failed', { error })
    return null
  }
}

// Request에서 관리자 정보 추출
export async function getAdminFromRequest(request: NextRequest): Promise<AdminJWTPayload | null> {
  // 1. 쿠키에서 토큰 추출 (admin_token)
  const tokenCookie = request.cookies.get('admin_token')
  if (tokenCookie?.value) {
    return await verifyAdminToken(tokenCookie.value)
  }

  // 2. Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return await verifyAdminToken(token)
  }

  return null
}

// 관리자 권한 확인
export async function requireAdminAuth(request: NextRequest): Promise<AdminJWTPayload | null> {
  const admin = await getAdminFromRequest(request)
  return admin
}

// 슈퍼관리자 권한 확인
export async function requireSuperAdmin(request: NextRequest): Promise<AdminJWTPayload | null> {
  const admin = await getAdminFromRequest(request)

  if (!admin || admin.role !== 'super_admin') {
    return null
  }

  return admin
}

/**
 * 비밀번호 검증 및 로그인
 * Phase 9b: 로그인 시도 제한 및 계정 잠금 처리
 */
export async function authenticateAdmin(
  loginId: string,
  password: string,
  ip?: string,
): Promise<AuthenticateResult | AuthenticateError> {
  const admin = await adminRepository.getAdminByLoginId(loginId) as AdminWithPassword | null

  if (!admin) {
    return {
      success: false,
      error: '로그인 ID 또는 비밀번호가 올바르지 않습니다.',
    }
  }

  // 계정 활성화 확인
  if (!admin.isActive) {
    return {
      success: false,
      error: '비활성화된 계정입니다. 관리자에게 문의하세요.',
    }
  }

  // 계정 잠금 확인
  const lockStatus = await adminRepository.isAccountLocked(admin)
  if (lockStatus.locked) {
    const lockedUntilStr = lockStatus.lockedUntil
      ? lockStatus.lockedUntil.toLocaleString('ko-KR')
      : ''
    return {
      success: false,
      error: `계정이 잠겼습니다. ${lockedUntilStr}까지 기다리거나 관리자에게 문의하세요.`,
      locked: true,
      lockedUntil: lockStatus.lockedUntil,
    }
  }

  // 비밀번호 검증
  const isValid = await adminRepository.verifyPassword(admin, password)
  if (!isValid) {
    // 로그인 실패 - 시도 횟수 증가
    const attemptResult = await adminRepository.incrementLoginAttempts(admin.id)

    if (attemptResult.locked) {
      const lockedUntilStr = attemptResult.lockedUntil
        ? attemptResult.lockedUntil.toLocaleString('ko-KR')
        : ''
      return {
        success: false,
        error: `로그인 시도 횟수를 초과했습니다. ${lockedUntilStr}까지 기다리거나 관리자에게 문의하세요.`,
        locked: true,
        lockedUntil: attemptResult.lockedUntil,
      }
    }

    // 남은 시도 횟수 안내 (무제한이 아닌 경우)
    if (attemptResult.remainingAttempts >= 0) {
      return {
        success: false,
        error: `로그인 ID 또는 비밀번호가 올바르지 않습니다. (남은 시도: ${attemptResult.remainingAttempts}회)`,
        remainingAttempts: attemptResult.remainingAttempts,
      }
    }

    return {
      success: false,
      error: '로그인 ID 또는 비밀번호가 올바르지 않습니다.',
    }
  }

  // 로그인 성공 - 시도 횟수 초기화 및 마지막 로그인 시간 업데이트
  await adminRepository.resetLoginAttempts(admin.id)
  await adminRepository.updateLastLogin(admin.id, ip)

  // JWT 발급
  const token = await signAdminToken(admin)

  // 비밀번호 해시 제외하고 반환
  const { passwordHash: _, previousPasswordHash: _prev, ...publicAdmin } = admin

  return { success: true, admin: publicAdmin, token }
}

// 액터 정보 추출 (감사 로그용)
export function getActorInfo(admin: AdminJWTPayload) {
  return {
    actorType: 'admin' as const,
    actorId: admin.sub,
    actorLoginId: admin.loginId,
    actorName: admin.name,
    actorRole: admin.role,
  }
}

/**
 * Phase 14: 관리자가 볼 수 있는 앱 필터 조건 반환
 * - super_admin: 전체
 * - admin (그룹 소속): 같은 그룹의 앱 + 본인이 생성한 앱
 * - admin (그룹 미소속): 본인이 생성한 앱만
 */
export async function getAdminVisibleAppIds(admin: AdminJWTPayload): Promise<string[] | null> {
  if (admin.role === 'super_admin') {
    return null // null = 전체 접근
  }

  const { adminRepository } = await import('./repositories/admin')
  const adminData = await adminRepository.getAdminById(admin.sub)

  if (!adminData?.groupId) {
    // 그룹 미소속: 본인이 생성한 앱만
    const prismaModule = await import('./prisma')
    const prisma = prismaModule.default
    const apps = await prisma.chatbotApp.findMany({
      where: { createdBy: admin.sub, isActive: true },
      select: { id: true },
    })
    return apps.map(a => a.id)
  }

  // 그룹 소속: 같은 그룹의 앱 + 본인이 생성한 앱
  const prismaModule = await import('./prisma')
  const prisma = prismaModule.default
  const apps = await prisma.chatbotApp.findMany({
    where: {
      isActive: true,
      OR: [
        { groupId: adminData.groupId },
        { createdBy: admin.sub },
      ],
    },
    select: { id: true },
  })
  return apps.map(a => a.id)
}

/**
 * Phase 14: 관리자가 특정 앱에 접근 가능한지 확인
 */
export async function canAdminAccessApp(
  admin: AdminJWTPayload,
  appCreatedBy: string | null,
  appGroupId: string | null,
): Promise<boolean> {
  if (admin.role === 'super_admin') { return true }
  if (appCreatedBy === admin.sub) { return true }

  // 그룹 기반 접근 체크
  if (appGroupId) {
    const { adminRepository } = await import('./repositories/admin')
    const adminData = await adminRepository.getAdminById(admin.sub)
    if (adminData?.groupId === appGroupId) { return true }
  }

  return false
}
