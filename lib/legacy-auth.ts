import { logger } from '@/lib/logger'

interface LegacyAuthResponse {
  success: boolean
  data?: {
    empNo: string
    loginId: string
    name: string
    department?: string
    role: string
  }
  error?: string
}

interface LegacyVerifyResponse {
  success: boolean
  data?: {
    empNo: string
    loginId: string
    name: string
    department?: string
    role: string
  }
  error?: string
}

/**
 * 레거시 인증 API와 연동하여 사용자 인증을 수행합니다.
 * Phase 9a: Mock 계정 제거, 레거시 API만 사용
 */
export async function authenticateWithLegacy(
  loginId: string,
  password: string,
): Promise<LegacyAuthResponse> {
  const authMode = process.env.AUTH_MODE || 'legacy'

  // 개발 테스트용 Mock 모드 (프로덕션에서는 사용 불가)
  if (authMode === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Mock auth mode is not allowed in production')
      return {
        success: false,
        error: 'Authentication service is not configured.',
      }
    }

    // 개발용 테스트 계정
    if (loginId === 'test' && password === 'test') {
      return {
        success: true,
        data: {
          empNo: 'TEST001',
          loginId: 'test',
          name: '테스트 사용자',
          department: 'Development',
          role: 'user',
        },
      }
    }
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // 레거시 API 모드
  const legacyAuthUrl = process.env.LEGACY_AUTH_API_URL

  if (!legacyAuthUrl) {
    return {
      success: false,
      error: 'Authentication service is not configured.',
    }
  }

  try {
    const response = await fetch(legacyAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginId,
        password,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        empNo: data.empNo,
        loginId: data.loginId,
        name: data.name,
        department: data.department,
        role: data.role || 'user',
      },
    }
  }
  catch (error) {
    logger.error('Legacy auth error', { error })
    return {
      success: false,
      error: 'Authentication service unavailable',
    }
  }
}

/**
 * 레거시 시스템에서 사용자 존재 여부를 확인합니다.
 * 시나리오 3 (인증형 임베드): HMAC 서명 검증 후 사용자 확인용
 */
export async function verifyUserWithLegacy(
  loginId: string,
  empNo: string,
): Promise<LegacyVerifyResponse> {
  const authMode = process.env.AUTH_MODE || 'legacy'

  // 개발 테스트용 Mock 모드 (프로덕션에서는 사용 불가)
  if (authMode === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Mock auth mode is not allowed in production')
      return {
        success: false,
        error: 'Verification service is not configured.',
      }
    }

    // Mock: 모든 사용자 통과
    return {
      success: true,
      data: {
        empNo,
        loginId,
        name: `Mock User (${loginId})`,
        department: 'Development',
        role: 'user',
      },
    }
  }

  const verifyUrl = process.env.LEGACY_VERIFY_API_URL

  if (!verifyUrl) {
    return {
      success: false,
      error: 'User verification service is not configured.',
    }
  }

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loginId, empNo }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'User verification failed',
      }
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        empNo: data.empNo || empNo,
        loginId: data.loginId || loginId,
        name: data.name,
        department: data.department,
        role: data.role || 'user',
      },
    }
  }
  catch (error) {
    logger.error('Legacy verify user error', { error })
    return {
      success: false,
      error: 'User verification service unavailable',
    }
  }
}
