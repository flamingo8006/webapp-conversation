import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { signToken } from '@/lib/jwt'

/**
 * Embed용 JWT 토큰 생성 API
 * 외부 시스템에서 사용자 정보를 보내면 JWT 토큰을 발급
 *
 * 보안: 프로덕션에서는 API Key 인증 또는 IP 화이트리스트 필요
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loginId, empNo, name, role = 'user' } = body

    // 필수 필드 검증
    if (!loginId || !empNo || !name) {
      return NextResponse.json(
        { error: 'loginId, empNo, name are required' },
        { status: 400 },
      )
    }

    // 보안: 프로덕션에서는 API Key 검증 추가
    // const apiKey = request.headers.get('X-API-Key')
    // if (apiKey !== process.env.EMBED_API_KEY) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    // JWT 토큰 생성
    const token = await signToken({
      sub: loginId,
      empNo,
      name,
      role,
    })

    return NextResponse.json({
      success: true,
      token,
      expiresIn: 3600, // 1시간
    })
  }
  catch (error) {
    console.error('Embed token generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
