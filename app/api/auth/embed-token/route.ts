import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getJwtExpirySeconds, signToken } from '@/lib/jwt'
import { logger } from '@/lib/logger'

/**
 * Embed용 JWT 토큰 생성 API
 * 외부 시스템(레거시 포털)에서 사용자 정보를 보내면 JWT 토큰을 발급
 *
 * 보안: EMBED_API_KEY 환경변수로 API Key 인증 필수
 */
export async function POST(request: NextRequest) {
  try {
    // EMBED_API_KEY 미설정 시 엔드포인트 비활성화
    const embedApiKey = process.env.EMBED_API_KEY
    if (!embedApiKey) {
      return NextResponse.json(
        { error: 'Embed token endpoint is not configured' },
        { status: 503 },
      )
    }

    // API Key 검증
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey !== embedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { loginId, empNo, name, role = 'user' } = body

    // 필수 필드 검증
    if (!loginId || !empNo || !name) {
      return NextResponse.json(
        { error: 'loginId, empNo, name are required' },
        { status: 400 },
      )
    }

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
      expiresIn: getJwtExpirySeconds(),
    })
  }
  catch (error) {
    logger.apiError(request, 'Embed token generation error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
