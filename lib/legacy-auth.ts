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

/**
 * 레거시 인증 API와 연동하여 사용자 인증을 수행합니다.
 * Phase 9a: Mock 계정 제거, 레거시 API만 사용
 */
export async function authenticateWithLegacy(
  loginId: string,
  password: string,
): Promise<LegacyAuthResponse> {
  const authMode = process.env.AUTH_MODE || 'legacy'

  // 개발 테스트용 Mock 모드
  if (authMode === 'mock') {
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
