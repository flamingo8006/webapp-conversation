import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // 쿠키 삭제
  response.cookies.delete('auth_token')
  response.cookies.delete('embed_auth_token')

  return response
}
