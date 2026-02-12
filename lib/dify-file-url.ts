/**
 * Dify 파일 URL → 프록시 URL 변환 유틸리티
 *
 * Dify 서버가 내부망에 위치하여 브라우저에서 직접 접근 불가.
 * Next.js 서버가 Dify 파일을 대신 가져와 브라우저에 전달하는 프록시 API를 통해 파일 제공.
 *
 * 예시:
 *   /files/tools/abc123.png?timestamp=...&sign=...
 *   → /api/apps/{appId}/files/tools/abc123.png?timestamp=...&sign=...
 *
 *   https://dify.internal/files/tools/abc123.png?timestamp=...
 *   → /api/apps/{appId}/files/tools/abc123.png?timestamp=...
 *
 * Node.js 의존성 없음 (순수 문자열 처리) → 클라이언트에서도 import 가능
 */

/**
 * Dify 파일 URL을 프록시 URL로 변환
 * @param url - Dify가 반환한 파일 URL (상대/절대)
 * @param appId - 챗봇 앱 ID
 * @returns 프록시 URL 또는 변환 불필요 시 원본 URL
 */
export function toDifyFileProxyUrl(url: string, appId: string): string {
  if (!url || !appId)
  { return url }

  // 이미 프록시 URL인 경우 변환 불필요
  if (url.startsWith('/api/apps/'))
  { return url }

  // 상대 경로: /files/... → /api/apps/{appId}/files/...
  if (url.startsWith('/files/'))
  { return `/api/apps/${appId}${url}` }

  // 절대 URL: https://dify.internal/files/... → /api/apps/{appId}/files/...
  const filesIndex = url.indexOf('/files/')
  if (filesIndex !== -1)
  { return `/api/apps/${appId}${url.slice(filesIndex)}` }

  // Dify 파일 URL이 아닌 경우 원본 반환
  return url
}
