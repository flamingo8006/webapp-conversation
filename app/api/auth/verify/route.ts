import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    // 쿠키 또는 Authorization 헤더에서 토큰 가져오기
    let token = request.cookies.get('auth_token')?.value

    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 },
      )
    }

    // 토큰 검증
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        loginId: payload.sub,
        empNo: payload.empNo,
        name: payload.name,
        role: payload.role,
      },
    })
  }
  catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
