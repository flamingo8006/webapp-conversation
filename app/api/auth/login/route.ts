import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithLegacy } from '@/lib/legacy-auth'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loginId, password } = body

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'loginId and password are required' },
        { status: 400 }
      )
    }

    // 레거시 인증 API 호출 (또는 Mock)
    const authResult = await authenticateWithLegacy(loginId, password)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    const { empNo, name, role } = authResult.data!

    // JWT 토큰 생성
    const token = await signToken({
      sub: loginId,
      empNo,
      name,
      role,
    })

    // 쿠키에 토큰 저장
    const response = NextResponse.json({
      success: true,
      user: { loginId, empNo, name, role },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1시간
      path: '/',
    })

    return response
  }
  catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
