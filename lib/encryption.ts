import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// 환경변수에서 암호화 키 로드
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  const keyBuffer = Buffer.from(key, 'base64')
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits)')
  }
  return keyBuffer
}

/**
 * API Key를 암호화합니다.
 * @param plainText 평문 API Key
 * @returns 암호화된 문자열 (iv:authTag:encryptedData 형식)
 */
export function encrypt(plainText: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // iv:authTag:encryptedData 형식으로 저장
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * 암호화된 API Key를 복호화합니다.
 * @param encryptedText 암호화된 문자열
 * @returns 평문 API Key
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()

  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format')
  }

  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encrypted = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * 암호화된 형식인지 확인합니다.
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':')
  return parts.length === 3
}
