/**
 * 입력값 검증 헬퍼 함수 (Phase 10-4)
 */

/**
 * 양의 정수인지 검증
 */
export function isPositiveInteger(value: string | null | undefined): boolean {
  if (!value) { return false }
  const num = Number.parseInt(value, 10)
  return !Number.isNaN(num) && num > 0 && String(num) === value
}

/**
 * 문자열을 양의 정수로 파싱 (실패 시 기본값 반환)
 */
export function parsePositiveInt(value: string | null | undefined, defaultValue: number): number {
  if (!value) { return defaultValue }
  const num = Number.parseInt(value, 10)
  if (Number.isNaN(num) || num <= 0) { return defaultValue }
  return num
}
