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
 * AUTH_MODE=mock인 경우 테스트 계정으로 인증합니다.
 */
export async function authenticateWithLegacy(
  loginId: string,
  password: string,
): Promise<LegacyAuthResponse> {
  const authMode = process.env.AUTH_MODE || 'mock'

  // Mock 모드: 테스트 계정
  if (authMode === 'mock') {
    const mockUsers = [
      {
        loginId: 'admin',
        password: 'admin123',
        empNo: '20210001',
        name: '관리자',
        department: '정보전산팀',
        role: 'admin',
      },
      {
        loginId: 'user',
        password: 'user123',
        empNo: '20210002',
        name: '테스트사용자',
        department: '학생팀',
        role: 'user',
      },
    ]

    const user = mockUsers.find(u => u.loginId === loginId && u.password === password)

    if (user) {
      const { password: _, ...userData } = user
      return { success: true, data: userData }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  // 레거시 API 모드
  const legacyAuthUrl = process.env.LEGACY_AUTH_API_URL

  if (!legacyAuthUrl) {
    throw new Error('LEGACY_AUTH_API_URL is not configured')
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
    console.error('Legacy auth error:', error)
    return {
      success: false,
      error: 'Authentication service unavailable',
    }
  }
}
