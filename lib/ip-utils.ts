/**
 * IP 주소 유틸리티
 * Phase 9b: 관리자 IP 화이트리스트 지원
 *
 * CIDR 표기법 지원:
 * - 단일 IP: 192.168.1.100
 * - IP 대역: 192.168.1.0/24
 */

/**
 * IP 주소를 32비트 정수로 변환
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
    return -1 // 유효하지 않은 IP
  }
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

/**
 * CIDR 표기법 파싱
 * @param cidr - IP 주소 또는 CIDR 표기 (예: "192.168.1.0/24" 또는 "192.168.1.100")
 * @returns { start: number, end: number } 또는 null
 */
function parseCIDR(cidr: string): { start: number, end: number } | null {
  const trimmed = cidr.trim()

  if (trimmed.includes('/')) {
    // CIDR 표기
    const [ip, maskStr] = trimmed.split('/')
    const mask = parseInt(maskStr, 10)

    if (Number.isNaN(mask) || mask < 0 || mask > 32) {
      return null
    }

    const ipNum = ipToNumber(ip)
    if (ipNum === -1) {
      return null
    }

    // 네트워크 마스크 계산
    const maskBits = 0xFFFFFFFF << (32 - mask)
    const start = (ipNum & maskBits) >>> 0
    const end = (start | (~maskBits >>> 0)) >>> 0

    return { start, end }
  }
  else {
    // 단일 IP
    const ipNum = ipToNumber(trimmed)
    if (ipNum === -1) {
      return null
    }
    return { start: ipNum >>> 0, end: ipNum >>> 0 }
  }
}

/**
 * IP 주소가 허용 목록에 있는지 확인
 * @param ip - 확인할 IP 주소
 * @param allowedList - 허용된 IP/CIDR 목록 (쉼표로 구분)
 * @returns true if allowed
 */
export function isIpAllowed(ip: string, allowedList: string): boolean {
  // 빈 문자열이면 모든 IP 허용
  if (!allowedList || allowedList.trim() === '') {
    return true
  }

  const ipNum = ipToNumber(ip)
  if (ipNum === -1) {
    // 유효하지 않은 IP는 거부
    return false
  }

  const ipUnsigned = ipNum >>> 0
  const rules = allowedList.split(',').map(s => s.trim()).filter(Boolean)

  for (const rule of rules) {
    const range = parseCIDR(rule)
    if (range && ipUnsigned >= range.start && ipUnsigned <= range.end) {
      return true
    }
  }

  return false
}

/**
 * Request에서 클라이언트 IP 추출
 */
export function getClientIp(headers: Headers): string {
  // X-Forwarded-For 헤더 (프록시 뒤에 있을 때)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 첫 번째 IP가 실제 클라이언트 IP
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP 헤더 (Nginx 등)
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // CF-Connecting-IP (Cloudflare)
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp.trim()
  }

  return 'unknown'
}
