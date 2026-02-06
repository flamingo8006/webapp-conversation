import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const admin = await prisma.admin.findUnique({
    where: { loginId: 'superadmin' },
  })

  if (!admin) {
    console.log('superadmin 계정이 없습니다.')
    return
  }

  console.log('계정 정보:')
  console.log('  ID:', admin.id)
  console.log('  loginId:', admin.loginId)
  console.log('  name:', admin.name)
  console.log('  role:', admin.role)
  console.log('  isActive:', admin.isActive)
  console.log('  loginAttempts:', admin.loginAttempts)
  console.log('  lockedUntil:', admin.lockedUntil)

  // 비밀번호 재설정
  const newPassword = 'ChangeMe123!'
  const newHash = await bcrypt.hash(newPassword, 12)

  await prisma.admin.update({
    where: { loginId: 'superadmin' },
    data: {
      passwordHash: newHash,
      loginAttempts: 0,
      lockedUntil: null,
    },
  })

  console.log('\n비밀번호가 재설정되었습니다: ChangeMe123!')
  console.log('로그인 시도 횟수 초기화 및 잠금 해제됨')

  await prisma.$disconnect()
}

main().catch(console.error)
