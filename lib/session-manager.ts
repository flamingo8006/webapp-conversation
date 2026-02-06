/**
 * 클라이언트 세션 관리 (익명 사용자용)
 * sessionStorage 기반 sessionId(UUID) 생성 및 관리
 * Phase 7: 익명 사용자 지원
 * Phase 9a: localStorage → sessionStorage 변경 (탭/브라우저 닫으면 세션 삭제)
 */

const SESSION_KEY = 'dgist_chatbot_session_id'

/**
 * UUID v4 생성 (폴백 함수)
 * crypto.randomUUID()가 지원되지 않는 환경을 위한 대체 구현
 */
function generateUUID(): string {
  // crypto.randomUUID() 지원 확인
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // 폴백: 간단한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * sessionId 조회 또는 생성
 * sessionStorage에 저장된 sessionId를 반환하거나, 없으면 새로 생성
 * Phase 9a: sessionStorage 사용 (탭/브라우저 닫으면 세션 삭제)
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined')
  { return '' }

  let sessionId = sessionStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = generateUUID()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

/**
 * sessionId 조회 (생성하지 않음)
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined')
  { return null }
  return sessionStorage.getItem(SESSION_KEY)
}

/**
 * sessionId 삭제
 * 로그인 시 익명 세션을 초기화할 때 사용
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined')
  { return }
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * sessionId 강제 설정 (테스트용)
 */
export function setSessionId(sessionId: string): void {
  if (typeof window === 'undefined')
  { return }
  sessionStorage.setItem(SESSION_KEY, sessionId)
}
