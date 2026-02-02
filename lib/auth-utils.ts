import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export interface UserInfo {
  empNo: string
  loginId: string
  name: string
}

/**
 * 요청에서 사용자 정보 추출
 * 1. 헤더에서 추출 (middleware가 설정한 값)
 * 2. JWT 토큰에서 직접 추출
 */
export async function getUserFromRequest(request: NextRequest): Promise<UserInfo | null> {
  // 1. 헤더에서 사용자 정보 가져오기 (middleware에서 설정)
  const empNo = request.headers.get('x-user-id')
  const loginId = request.headers.get('x-user-login-id')
  const nameBase64 = request.headers.get('x-user-name')

  if (empNo && loginId && nameBase64) {
    try {
      // Base64 디코딩
      const name = Buffer.from(nameBase64, 'base64').toString('utf-8')
      return { empNo, loginId, name }
    }
    catch (error) {
      console.error('Failed to decode user name:', error)
    }
  }

  // 2. 헤더가 없으면 토큰에서 직접 추출
  let token = request.cookies.get('auth_token')?.value

  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  if (!token)
    return null

  const payload = await verifyToken(token)
  if (!payload)
    return null

  return {
    empNo: payload.empNo,
    loginId: payload.sub,
    name: payload.name,
  }
}
