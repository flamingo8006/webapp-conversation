/**
 * JWT 임베드 토큰 생성 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/generate-embed-token.ts --appId=<appId> --empNo=<empNo> --name=<name>
 *
 * 예시:
 *   npx ts-node scripts/generate-embed-token.ts --appId=abc123 --empNo=20210001 --name="홍길동"
 *
 * 환경변수 필요:
 *   - JWT_PRIVATE_KEY: RSA 개인키 (PEM 형식)
 *   - JWT_ISSUER: JWT 발급자 (기본값: dgist-auth)
 *   - JWT_AUDIENCE: JWT 대상 (기본값: dgist-chatbot)
 */

import { importPKCS8, SignJWT } from 'jose'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

interface TokenParams {
  appId: string
  empNo: string
  loginId?: string
  name: string
  role?: string
  expiresIn?: string
}

async function generateEmbedToken(params: TokenParams): Promise<string> {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY
  if (!privateKeyPem) {
    throw new Error('JWT_PRIVATE_KEY 환경변수가 설정되지 않았습니다.')
  }

  const privateKey = await importPKCS8(privateKeyPem, 'RS256')

  const payload = {
    sub: params.loginId || params.empNo,
    empNo: params.empNo,
    name: params.name,
    role: params.role || 'user',
  }

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(params.expiresIn || '24h')
    .setIssuer(process.env.JWT_ISSUER || 'dgist-auth')
    .setAudience(process.env.JWT_AUDIENCE || 'dgist-chatbot')
    .sign(privateKey)

  return token
}

function parseArgs(): TokenParams {
  const args = process.argv.slice(2)
  const params: Partial<TokenParams> = {}

  for (const arg of args) {
    if (arg.startsWith('--appId=')) {
      params.appId = arg.slice(8)
    }
    else if (arg.startsWith('--empNo=')) {
      params.empNo = arg.slice(8)
    }
    else if (arg.startsWith('--loginId=')) {
      params.loginId = arg.slice(10)
    }
    else if (arg.startsWith('--name=')) {
      params.name = arg.slice(7)
    }
    else if (arg.startsWith('--role=')) {
      params.role = arg.slice(7)
    }
    else if (arg.startsWith('--expiresIn=')) {
      params.expiresIn = arg.slice(12)
    }
  }

  if (!params.appId || !params.empNo || !params.name) {
    console.error('필수 인자가 누락되었습니다.')
    console.error('사용법: npx ts-node scripts/generate-embed-token.ts --appId=<appId> --empNo=<empNo> --name=<name>')
    console.error('')
    console.error('옵션:')
    console.error('  --appId=<string>      챗봇 앱 ID (필수)')
    console.error('  --empNo=<string>      사원번호 (필수)')
    console.error('  --name=<string>       사용자 이름 (필수)')
    console.error('  --loginId=<string>    로그인 ID (선택, 기본값: empNo)')
    console.error('  --role=<string>       역할 (선택, 기본값: user)')
    console.error('  --expiresIn=<string>  만료 시간 (선택, 기본값: 24h)')
    process.exit(1)
  }

  return params as TokenParams
}

async function main() {
  try {
    const params = parseArgs()
    const token = await generateEmbedToken(params)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const embedUrl = `${baseUrl}/embed/${params.appId}?token=${token}`

    console.log('='.repeat(80))
    console.log('JWT 임베드 토큰 생성 완료')
    console.log('='.repeat(80))
    console.log('')
    console.log('토큰:')
    console.log(token)
    console.log('')
    console.log('임베드 URL:')
    console.log(embedUrl)
    console.log('')
    console.log('HTML iframe 코드:')
    console.log(`<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`)
    console.log('')
    console.log('='.repeat(80))
    console.log('')
    console.log('테스트 시나리오:')
    console.log('1. 유효한 토큰: 위 URL로 접속하여 채팅 로드 확인')
    console.log('2. 잘못된 토큰: token 값 일부 수정 후 접속 → 401 Unauthorized 확인')
    console.log('3. 만료된 토큰: --expiresIn=1s 옵션으로 생성 후 2초 후 접속 → 401 확인')
    console.log('4. 토큰 없음: /embed/<appId> 직접 접속 → 인증 필요 메시지 확인')
    console.log('5. 쿠키 재접속: 최초 접속 후 토큰 제거하고 재접속 → 쿠키로 작동 확인')
    console.log('')
  }
  catch (error) {
    console.error('오류 발생:', error)
    process.exit(1)
  }
}

main()
