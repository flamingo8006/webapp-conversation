import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // 쿠키 삭제
  response.cookies.delete('auth_token')
  response.cookies.delete('embed_auth_token')

  return response
}
