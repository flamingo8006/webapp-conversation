import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// 직접 Prisma Client 생성 (시드 스크립트용)
function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

const prisma = createPrismaClient()

async function main() {
  console.log('Seeding database...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))

  // 슈퍼관리자 계정 생성
  const existingSuperAdmin = await prisma.admin.findUnique({
    where: { loginId: 'superadmin' },
  })

  if (!existingSuperAdmin) {
    // Phase 9b: 비밀번호 정책 준수 (10~20자, 영대소문자/숫자/특수문자 포함)
    const initialPassword = 'ChangeMe123!'
    const passwordHash = await bcrypt.hash(initialPassword, 12)

    await prisma.admin.create({
      data: {
        loginId: 'superadmin',
        passwordHash,
        name: '슈퍼관리자',
        email: 'superadmin@dgist.ac.kr',
        role: 'super_admin',
        isActive: true,
      },
    })

    console.log('Created super admin account:')
    console.log('  Login ID: superadmin')
    console.log(`  Password: ${initialPassword}`)
    console.log('  ⚠️  Please change the password after first login!')
  }
  else {
    console.log('Super admin account already exists')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
