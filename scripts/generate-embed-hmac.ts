/**
 * HMAC 서명 URL 생성 스크립트 (인증형 임베드 테스트용)
 *
 * 사용법:
 *   npx ts-node scripts/generate-embed-hmac.ts --appId=<appId> --loginId=<loginId> --empNo=<empNo> --name=<name>
 *
 * 예시:
 *   npx ts-node scripts/generate-embed-hmac.ts --appId=abc123 --loginId=hong --empNo=20210001 --name="홍길동"
 *
 * 환경변수 필요:
 *   - EMBED_HMAC_SECRET: HMAC 공유 비밀키
 */

import { createHmac } from 'crypto'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

interface HmacParams {
  appId: string
  loginId: string
  empNo: string
  name: string
}

function generateHmacUrl(params: HmacParams): string {
  const secret = process.env.EMBED_HMAC_SECRET
  if (!secret) {
    throw new Error('EMBED_HMAC_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const ts = String(Date.now())
  const canonicalString = `loginId=${params.loginId}&empNo=${params.empNo}&name=${params.name}&ts=${ts}`

  const sig = createHmac('sha256', secret)
    .update(canonicalString)
    .digest('hex')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const queryParams = new URLSearchParams({
    loginId: params.loginId,
    empNo: params.empNo,
    name: params.name,
    ts,
    sig,
  })

  return `${baseUrl}/embed/${params.appId}?${queryParams.toString()}`
}

function parseArgs(): HmacParams {
  const args = process.argv.slice(2)
  const params: Partial<HmacParams> = {}

  for (const arg of args) {
    if (arg.startsWith('--appId=')) {
      params.appId = arg.slice(8)
    }
    else if (arg.startsWith('--loginId=')) {
      params.loginId = arg.slice(10)
    }
    else if (arg.startsWith('--empNo=')) {
      params.empNo = arg.slice(8)
    }
    else if (arg.startsWith('--name=')) {
      params.name = arg.slice(7)
    }
  }

  if (!params.appId || !params.loginId || !params.empNo || !params.name) {
    console.error('필수 인자가 누락되었습니다.')
    console.error('사용법: npx ts-node scripts/generate-embed-hmac.ts --appId=<appId> --loginId=<loginId> --empNo=<empNo> --name=<name>')
    console.error('')
    console.error('옵션:')
    console.error('  --appId=<string>     챗봇 앱 ID (필수)')
    console.error('  --loginId=<string>   로그인 ID (필수)')
    console.error('  --empNo=<string>     사원번호 (필수)')
    console.error('  --name=<string>      사용자 이름 (필수)')
    process.exit(1)
  }

  return params as HmacParams
}

async function main() {
  try {
    const params = parseArgs()
    const url = generateHmacUrl(params)

    console.log('='.repeat(80))
    console.log('HMAC 서명 임베드 URL 생성 완료')
    console.log('='.repeat(80))
    console.log('')
    console.log('임베드 URL:')
    console.log(url)
    console.log('')
    console.log('HTML iframe 코드:')
    console.log(`<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`)
    console.log('')
    console.log('='.repeat(80))
    console.log('')
    console.log('테스트 시나리오:')
    console.log('1. 유효한 URL: 위 URL로 브라우저 접속 → HMAC 검증 → 인증 → 채팅')
    console.log('2. 만료된 URL: 5분 후 접속 → "Timestamp expired" 에러')
    console.log('3. 변조된 URL: sig 값 수정 → "Invalid signature" 에러')
    console.log('4. 파라미터 누락: loginId 제거 → "Missing required parameters" 에러')
    console.log('')
    console.log('참고:')
    console.log('- HMAC 서명은 5분간 유효합니다.')
    console.log('- 인증 성공 후 embed_auth_token 쿠키가 설정됩니다.')
    console.log('')
  }
  catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  }
}

main()
