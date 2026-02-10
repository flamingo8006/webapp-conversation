import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

// JWT Payload 타입
export interface JWTPayload {
  sub: string // loginId
  empNo: string // 사원번호
  name: string // 이름
  role: string // 'user' | 'admin'
  iat: number // 발급 시간
  exp: number // 만료 시간
  iss: string // 발급자
  aud: string // 대상
}

// JWT 만료 시간 헬퍼 (환경변수 JWT_EXPIRY_HOURS, 기본값 8시간)
export function getJwtExpiryHours(): number {
  return parseInt(process.env.JWT_EXPIRY_HOURS || '8', 10) || 8
}

export function getJwtExpirySeconds(): number {
  return getJwtExpiryHours() * 3600
}

// 환경변수에서 키 로드
const getPublicKey = async () => {
  const publicKeyPem = process.env.JWT_PUBLIC_KEY!
  return await importSPKI(publicKeyPem, 'RS256')
}

const getPrivateKey = async () => {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY!
  return await importPKCS8(privateKeyPem, 'RS256')
}

// JWT 검증
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const publicKey = await getPublicKey()

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: process.env.JWT_ISSUER || 'dgist-auth',
      audience: process.env.JWT_AUDIENCE || 'dgist-chatbot',
    })

    return payload as unknown as JWTPayload
  }
  catch (error) {
    logger.error('JWT verification failed', { error })
    return null
  }
}

// JWT 발급 (레거시 인증 후)
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
  const privateKey = await getPrivateKey()

  const token = await new SignJWT({ ...payload } as any)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(`${getJwtExpiryHours()}h`)
    .setIssuer(process.env.JWT_ISSUER || 'dgist-auth')
    .setAudience(process.env.JWT_AUDIENCE || 'dgist-chatbot')
    .sign(privateKey)

  return token
}

// Request에서 사용자 정보 추출
export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  // 1. Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return await verifyToken(token)
  }

  // 2. 쿠키에서 토큰 추출
  const tokenCookie = request.cookies.get('auth_token')
  if (tokenCookie?.value) {
    return await verifyToken(tokenCookie.value)
  }

  // 3. Embed 모드 쿠키 확인
  const embedTokenCookie = request.cookies.get('embed_auth_token')
  if (embedTokenCookie?.value) {
    return await verifyToken(embedTokenCookie.value)
  }

  return null
}

// 관리자 권한 확인
export async function requireAdmin(request: NextRequest): Promise<JWTPayload | null> {
  const user = await getUserFromRequest(request)

  if (!user || user.role !== 'admin') {
    return null
  }

  return user
}
