import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'

interface EmbedSignatureParams {
  loginId: string
  empNo: string
  name: string
  ts: string
  sig: string
}

interface VerifyResult {
  valid: boolean
  error?: string
}

// 타임스탬프 유효 기간 (밀리초)
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000 // 5분

/**
 * HMAC-SHA256 서명을 검증합니다.
 * 정규화된 문자열: loginId={v}&empNo={v}&name={v}&ts={v}
 */
export function verifyEmbedSignature(params: EmbedSignatureParams): VerifyResult {
  const secret = process.env.EMBED_HMAC_SECRET
  if (!secret) {
    return { valid: false, error: 'HMAC secret is not configured' }
  }

  // 필수 파라미터 확인
  if (!params.loginId || !params.empNo || !params.name || !params.ts || !params.sig) {
    return { valid: false, error: 'Missing required parameters' }
  }

  // 타임스탬프 유효성 검증 (5분 이내)
  const tsMs = parseInt(params.ts, 10)
  if (Number.isNaN(tsMs)) {
    return { valid: false, error: 'Invalid timestamp format' }
  }

  const now = Date.now()
  if (Math.abs(now - tsMs) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, error: 'Timestamp expired' }
  }

  // 정규화된 문자열 생성
  const canonicalString = `loginId=${params.loginId}&empNo=${params.empNo}&name=${params.name}&ts=${params.ts}`

  // HMAC-SHA256 서명 생성
  const expectedSig = createHmac('sha256', secret)
    .update(canonicalString)
    .digest('hex')

  // timing-safe 비교
  try {
    const sigBuffer = Buffer.from(params.sig, 'hex')
    const expectedBuffer = Buffer.from(expectedSig, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Invalid signature' }
    }

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid signature' }
    }
  }
  catch {
    return { valid: false, error: 'Invalid signature format' }
  }

  return { valid: true }
}

/**
 * HMAC-SHA256 서명을 생성합니다. (테스트/스크립트용)
 */
export function generateEmbedSignature(params: { loginId: string, empNo: string, name: string, ts?: string }): { sig: string, ts: string, canonicalString: string } {
  const secret = process.env.EMBED_HMAC_SECRET
  if (!secret) {
    throw new Error('EMBED_HMAC_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const ts = params.ts || String(Date.now())
  const canonicalString = `loginId=${params.loginId}&empNo=${params.empNo}&name=${params.name}&ts=${ts}`

  const sig = createHmac('sha256', secret)
    .update(canonicalString)
    .digest('hex')

  logger.debug('Generated HMAC signature', { loginId: params.loginId, ts })

  return { sig, ts, canonicalString }
}
