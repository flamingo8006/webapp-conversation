/**
 * 암호화 테스트 스크립트
 * 실행: npx tsx scripts/test-encryption.ts
 */

import { encrypt, decrypt } from '@/lib/encryption'

const testApiKey = 'app-Dm1zwHSQu2B12IlAPaZ9kMhy'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  암호화/복호화 테스트')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('원본 API Key:', testApiKey)

// 암호화
const encrypted = encrypt(testApiKey)
console.log('\n암호화된 값:', encrypted)

// 복호화
const decrypted = decrypt(encrypted)
console.log('\n복호화된 값:', decrypted)

// 검증
if (decrypted === testApiKey) {
  console.log('\n✅ 암호화/복호화 성공!')
} else {
  console.log('\n❌ 암호화/복호화 실패!')
  console.log('기대값:', testApiKey)
  console.log('실제값:', decrypted)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
