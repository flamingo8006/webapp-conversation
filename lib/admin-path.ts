/**
 * 관리자 경로 유틸리티
 *
 * NEXT_PUBLIC_ADMIN_BASE_PATH 환경변수로 관리자 URL 경로를 변경할 수 있습니다.
 * 기본값: 'admin' (예: /admin/login, /admin/apps)
 * 커스텀 예: '_sys2026' → /_sys2026/login, /_sys2026/apps
 *
 * 설정 방법: .env.local에 NEXT_PUBLIC_ADMIN_BASE_PATH=_sys2026 추가
 */
const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || 'admin'

/**
 * 관리자 경로 생성
 * @param path 관리자 하위 경로 (예: '/login', '/apps', '/apps/new')
 * @returns 전체 관리자 경로 (예: '/_sys2026/login')
 */
export function adminPath(path: string = ''): string {
  return `/${ADMIN_BASE_PATH}${path}`
}

/**
 * 관리자 기본 경로 반환 (슬래시 없이)
 */
export function getAdminBasePath(): string {
  return ADMIN_BASE_PATH
}

/**
 * 주어진 pathname이 관리자 경로인지 확인
 */
export function isCustomAdminPath(pathname: string): boolean {
  return pathname === `/${ADMIN_BASE_PATH}` || pathname.startsWith(`/${ADMIN_BASE_PATH}/`)
}

/**
 * 커스텀 관리자 경로가 설정되었는지 확인
 */
export function hasCustomAdminPath(): boolean {
  return ADMIN_BASE_PATH !== 'admin'
}
