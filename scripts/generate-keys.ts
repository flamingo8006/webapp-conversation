/**
 * JWT 및 암호화 키 생성 스크립트
 *
 * 실행: npx tsx scripts/generate-keys.ts
 */

import { generateKeyPairSync, randomBytes } from 'node:crypto'

function generateJWTKeys() {
  console.log('🔑 JWT RSA 키 쌍 생성 중...\n')

  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  console.log('=== JWT_PUBLIC_KEY ===')
  console.log(publicKey)
  console.log()

  console.log('=== JWT_PRIVATE_KEY ===')
  console.log(privateKey)
  console.log()
}

function generateEncryptionKey() {
  console.log('🔐 암호화 키 생성 중...\n')

  const key = randomBytes(32) // 256 bits
  const base64Key = key.toString('base64')

  console.log('=== ENCRYPTION_KEY ===')
  console.log(base64Key)
  console.log()
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  DGIST AI 챗봇 - 키 생성 스크립트')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

generateJWTKeys()
generateEncryptionKey()

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ 완료! .env.local 파일에 위 키들을 복사하세요.')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
