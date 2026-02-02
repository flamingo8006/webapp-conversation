import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// 인증이 필요 없는 경로 (startsWith로 체크)
const publicPathPrefixes = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/apps/public',
  '/login',
  '/_next',
  '/favicon.ico',
  '/public',
]

// 정확히 일치해야 하는 공개 경로
const publicExactPaths = [
  '/', // Phase 7: 메인 포털 페이지만 익명 접근 허용
]

// 관리자 전용 경로
const adminPaths = [
  '/admin',
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과 (prefix 매칭 또는 정확히 일치)
  if (publicPathPrefixes.some(path => pathname.startsWith(path)) ||
      publicExactPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Phase 7: 공개 챗봇 경로 처리 (/simple-chat/[appId], /api/apps/[appId]/*)
  // Edge Runtime에서 DB 조회 불가하므로, 일단 통과시키고 API 라우트에서 권한 체크
  if (pathname.startsWith('/simple-chat/') || pathname.startsWith('/api/apps/')) {
    // sessionId 또는 JWT 확인
    const sessionId = request.headers.get('x-session-id')
    let token = request.cookies.get('auth_token')?.value

    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    const requestHeaders = new Headers(request.headers)

    // sessionId가 있으면 익명 사용자로 표시
    if (sessionId) {
      requestHeaders.set('x-is-anonymous', 'true')
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // JWT가 있으면 인증 사용자로 처리
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        requestHeaders.set('x-user-id', payload.empNo)
        requestHeaders.set('x-user-login-id', payload.sub)
        requestHeaders.set('x-user-name', Buffer.from(payload.name, 'utf-8').toString('base64'))
        requestHeaders.set('x-user-role', payload.role)
        requestHeaders.set('x-is-anonymous', 'false')
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    }

    // sessionId도 token도 없으면 통과 (API 라우트에서 챗봇 설정 확인 후 처리)
    // 페이지 요청은 통과, API 요청도 통과 (API에서 권한 체크)
    return NextResponse.next()
  }

  // Embed 모드: URL 파라미터로 토큰 전달
  if (pathname.startsWith('/embed/')) {
    const token = request.nextUrl.searchParams.get('token')
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        // 토큰이 유효하면 세션 쿠키 설정 후 통과
        const response = NextResponse.next()
        response.cookies.set('embed_auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none', // iframe에서 접근 가능하도록
          maxAge: 60 * 60 * 24, // 24시간
        })
        return response
      }
    }
    // embed 쿠키 확인
    const embedToken = request.cookies.get('embed_auth_token')?.value
    if (embedToken) {
      const payload = await verifyToken(embedToken)
      if (payload) {
        return NextResponse.next()
      }
    }
    // 인증 실패
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 일반 경로: 쿠키 또는 Authorization 헤더에서 토큰 확인
  let token = request.cookies.get('auth_token')?.value

  if (!token) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }

  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 토큰 검증
  const payload = await verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 관리자 경로 권한 확인
  if (adminPaths.some(path => pathname.startsWith(path))) {
    if (payload.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return new NextResponse('Forbidden', { status: 403 })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 요청 헤더에 사용자 정보 추가 (API 라우트에서 사용)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.empNo)
  requestHeaders.set('x-user-login-id', payload.sub)
  // 한글 이름을 Base64로 인코딩하여 전달
  requestHeaders.set('x-user-name', Buffer.from(payload.name, 'utf-8').toString('base64'))
  requestHeaders.set('x-user-role', payload.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
