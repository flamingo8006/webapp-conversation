import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

/**
 * 관리자 경로 설정 (Edge Runtime용 - lib/admin-path.ts와 동일한 값 사용)
 * NEXT_PUBLIC_ 접두사이므로 Edge Runtime에서도 접근 가능
 */
const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'admin'
const isCustomAdminPath = ADMIN_BASE_PATH !== 'admin'

/**
 * Request ID 생성 (요청 추적용)
 */
function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/**
 * NextResponse.next()에 request ID 헤더를 포함하여 반환
 * 기존 request headers를 복제하여 Cookie 등 원본 헤더를 유지
 */
function nextWithRequestId(request: NextRequest, requestId: string, headers?: Headers): NextResponse {
  const requestHeaders = headers || new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

/**
 * 간단한 IP 화이트리스트 체크 (Edge Runtime용)
 * CIDR 지원 (기본적인 /24, /16 등)
 */
function isIpAllowedSimple(ip: string, allowedList: string): boolean {
  if (!allowedList || allowedList.trim() === '') {
    return true // 설정 없으면 모든 IP 허용
  }

  const rules = allowedList.split(',').map(s => s.trim()).filter(Boolean)

  for (const rule of rules) {
    if (rule.includes('/')) {
      // CIDR 표기법
      const [network, maskStr] = rule.split('/')
      const mask = parseInt(maskStr, 10)
      if (Number.isNaN(mask) || mask < 0 || mask > 32) { continue }

      const ipParts = ip.split('.').map(Number)
      const networkParts = network.split('.').map(Number)

      if (ipParts.length !== 4 || networkParts.length !== 4) { continue }

      // 간단한 비교: 마스크에 따라 앞부분 비교
      const bytesToCompare = Math.floor(mask / 8)
      let match = true

      for (let i = 0; i < bytesToCompare; i++) {
        if (ipParts[i] !== networkParts[i]) {
          match = false
          break
        }
      }

      if (match) { return true }
    }
    else {
      // 단일 IP
      if (ip === rule) { return true }
    }
  }

  return false
}

// 인증이 필요 없는 경로 (startsWith로 체크)
const publicPathPrefixes = [
  '/api/auth/login',
  '/api/auth/verify',
  '/api/auth/token', // Phase 9a: 토큰 처리 API
  '/api/apps/public',
  '/api/admin/auth/login', // Phase 8b: 관리자 로그인 API
  '/api/errors/report', // Phase 8b: 에러 리포트 API
  '/login', // Phase 9a: 안내 페이지로 변경됨
  '/_next',
  '/favicon.ico',
  '/public',
]

// 정확히 일치해야 하는 공개 경로
const publicExactPaths = [
  '/', // Phase 7: 메인 포털 페이지만 익명 접근 허용
]

// 관리자 전용 경로 (커스텀 경로 사용)
const adminPagePaths = [
  `/${ADMIN_BASE_PATH}`,
]
const adminApiPaths = [
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = generateRequestId()

  // 공개 경로는 통과 (prefix 매칭 또는 정확히 일치)
  if (publicPathPrefixes.some(path => pathname.startsWith(path))
    || publicExactPaths.includes(pathname)) {
    return nextWithRequestId(request, requestId)
  }

  // 커스텀 관리자 경로가 설정된 경우, 기본 /admin 경로 접근 차단 (API 제외)
  if (isCustomAdminPath && (pathname === '/admin' || pathname.startsWith('/admin/')) && !pathname.startsWith('/api/admin')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // 관리자 페이지 경로 처리 (커스텀 경로 → 내부 /admin으로 rewrite)
  if (adminPagePaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    // IP 화이트리스트 체크
    const allowedIps = process.env.ADMIN_ALLOWED_IPS || ''
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!isIpAllowedSimple(clientIp, allowedIps)) {
      return new NextResponse('Forbidden: IP not allowed', { status: 403 })
    }

    // 로그인 페이지는 인증 없이 rewrite
    const isLoginPage = pathname === `/${ADMIN_BASE_PATH}/login`

    // 로그인 페이지가 아닌 경우 admin_token 쿠키 확인
    if (!isLoginPage) {
      const adminToken = request.cookies.get('admin_token')?.value
      if (!adminToken) {
        return NextResponse.redirect(new URL(`/${ADMIN_BASE_PATH}/login`, request.url))
      }
    }

    // 커스텀 경로 → 내부 /admin 경로로 rewrite
    if (isCustomAdminPath) {
      const internalPath = pathname.replace(`/${ADMIN_BASE_PATH}`, '/admin')
      const url = request.nextUrl.clone()
      url.pathname = internalPath
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-request-id', requestId)
      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      })
    }

    return nextWithRequestId(request, requestId)
  }

  // 관리자 API 경로 처리
  if (adminApiPaths.some(path => pathname.startsWith(path))) {
    const allowedIps = process.env.ADMIN_ALLOWED_IPS || ''
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!isIpAllowedSimple(clientIp, allowedIps)) {
      return new NextResponse('Forbidden: IP not allowed', { status: 403 })
    }

    return nextWithRequestId(request, requestId)
  }

  // Phase 7: 공개 챗봇 경로 처리 (/simple-chat/[appId], /chat/[appId], /api/apps/[appId]/*)
  // Edge Runtime에서 DB 조회 불가하므로, 일단 통과시키고 API 라우트/페이지에서 권한 체크
  if (pathname.startsWith('/simple-chat/') || pathname.startsWith('/chat/') || pathname.startsWith('/api/apps/')) {
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

    // JWT를 먼저 확인 (인증 사용자 우선)
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        requestHeaders.set('x-user-id', payload.empNo)
        requestHeaders.set('x-user-login-id', payload.sub)
        requestHeaders.set('x-user-name', Buffer.from(payload.name, 'utf-8').toString('base64'))
        requestHeaders.set('x-user-role', payload.role)
        requestHeaders.set('x-is-anonymous', 'false')
        return nextWithRequestId(request, requestId, requestHeaders)
      }
    }

    // JWT 없고 sessionId가 있으면 익명 사용자로 표시
    if (sessionId) {
      requestHeaders.set('x-is-anonymous', 'true')
      return nextWithRequestId(request, requestId, requestHeaders)
    }

    // sessionId도 token도 없으면 통과 (API 라우트에서 챗봇 설정 확인 후 처리)
    // 페이지 요청은 통과, API 요청도 통과 (API에서 권한 체크)
    return nextWithRequestId(request, requestId)
  }

  // Embed 모드: URL 파라미터로 토큰 전달
  if (pathname.startsWith('/embed/')) {
    const token = request.nextUrl.searchParams.get('token')
    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        // 토큰이 유효하면 세션 쿠키 설정 후 통과
        const embedHeaders = new Headers(request.headers)
        embedHeaders.set('x-request-id', requestId)
        const response = NextResponse.next({ request: { headers: embedHeaders } })
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
        return nextWithRequestId(request, requestId)
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

  // Phase 9a: 토큰이 없으면 포털 메인으로 리다이렉트 (익명 접근 허용)
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    // 인증 필요 페이지 접근 시 메인으로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 토큰 검증
  const payload = await verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    // 무효한 토큰은 메인으로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 요청 헤더에 사용자 정보 추가 (API 라우트에서 사용)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.empNo)
  requestHeaders.set('x-user-login-id', payload.sub)
  // 한글 이름을 Base64로 인코딩하여 전달
  requestHeaders.set('x-user-name', Buffer.from(payload.name, 'utf-8').toString('base64'))
  requestHeaders.set('x-user-role', payload.role)

  return nextWithRequestId(request, requestId, requestHeaders)
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
