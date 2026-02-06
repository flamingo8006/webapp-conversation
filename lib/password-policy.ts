/**
 * 비밀번호 정책 검증 유틸리티
 * Phase 9b: 관리자 비밀번호 정책 강화
 *
 * 정책:
 * - 길이: 10~20자
 * - 필수 포함: 영대문자 + 영소문자 + 숫자 + 특수문자
 * - 제외 특수문자: <, >, ', "
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

// 허용되지 않는 문자
const FORBIDDEN_CHARS = ['<', '>', '\'', '"']

// 특수문자 (금지문자 제외)
const ALLOWED_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,./?\\'

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // 길이 체크 (10~20자)
  if (password.length < 10) {
    errors.push('비밀번호는 최소 10자 이상이어야 합니다.')
  }
  if (password.length > 20) {
    errors.push('비밀번호는 최대 20자까지 가능합니다.')
  }

  // 영대문자 포함 확인
  if (!/[A-Z]/.test(password)) {
    errors.push('영문 대문자를 포함해야 합니다.')
  }

  // 영소문자 포함 확인
  if (!/[a-z]/.test(password)) {
    errors.push('영문 소문자를 포함해야 합니다.')
  }

  // 숫자 포함 확인
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.')
  }

  // 특수문자 포함 확인 (금지문자 제외)
  const hasSpecialChar = [...password].some(char =>
    ALLOWED_SPECIAL_CHARS.includes(char),
  )
  if (!hasSpecialChar) {
    errors.push('특수문자를 포함해야 합니다. (!@#$%^&* 등)')
  }

  // 금지 문자 체크
  const forbiddenFound = FORBIDDEN_CHARS.filter(char => password.includes(char))
  if (forbiddenFound.length > 0) {
    errors.push(`사용할 수 없는 문자가 포함되어 있습니다: ${forbiddenFound.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 비밀번호 정책 설명 반환
 */
export function getPasswordPolicyDescription(): string[] {
  return [
    '10~20자 길이',
    '영문 대문자 포함',
    '영문 소문자 포함',
    '숫자 포함',
    '특수문자 포함 (!@#$%^&* 등)',
    '<, >, \', " 문자 사용 불가',
  ]
}
