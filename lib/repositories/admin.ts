import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { validatePassword } from '@/lib/password-policy'

export interface AdminCreateInput {
  loginId: string
  password: string
  name: string
  email?: string
  department?: string
  role?: 'super_admin' | 'admin'
  createdBy?: string
}

export interface AdminUpdateInput {
  name?: string
  email?: string
  department?: string
  role?: 'super_admin' | 'admin'
  isActive?: boolean
  updatedBy?: string
}

export interface AdminPublic {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: string
  isActive: boolean
  groupId: string | null
  groupRole: string
  loginAttempts: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
  lastLoginIp: string | null
  createdAt: Date
  createdBy: string | null
  updatedAt: Date
  updatedBy: string | null
}

export interface AdminWithPassword extends AdminPublic {
  passwordHash: string
  previousPasswordHash: string | null
}

const SALT_ROUNDS = 12

// 환경변수에서 최대 로그인 시도 횟수 가져오기 (기본값: 5, 0=무제한)
function getMaxLoginAttempts(): number {
  const maxAttempts = process.env.ADMIN_MAX_LOGIN_ATTEMPTS
  if (maxAttempts === undefined || maxAttempts === '') {
    return 5 // 기본값
  }
  const num = parseInt(maxAttempts, 10)
  return Number.isNaN(num) ? 5 : num
}

// 잠금 시간 (분) - 기본 30분
function getLockoutMinutes(): number {
  const minutes = process.env.ADMIN_LOCKOUT_MINUTES
  if (minutes === undefined || minutes === '') {
    return 30
  }
  const num = parseInt(minutes, 10)
  return Number.isNaN(num) ? 30 : num
}

function toPublic(admin: AdminWithPassword): AdminPublic {
  const { passwordHash: _, previousPasswordHash: _prev, ...publicData } = admin
  return publicData
}

export const adminRepository = {
  async createAdmin(input: AdminCreateInput): Promise<AdminPublic> {
    // 비밀번호 정책 검증
    const validation = validatePassword(input.password)
    if (!validation.isValid) {
      throw new Error(`비밀번호 정책 위반: ${validation.errors.join(', ')}`)
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

    const admin = await prisma.admin.create({
      data: {
        loginId: input.loginId,
        passwordHash,
        name: input.name,
        email: input.email,
        department: input.department,
        role: input.role || 'admin',
        createdBy: input.createdBy,
      },
    })

    return toPublic(admin as AdminWithPassword)
  },

  async getAdminByLoginId(loginId: string): Promise<AdminWithPassword | null> {
    const admin = await prisma.admin.findUnique({
      where: { loginId },
    })

    return admin as AdminWithPassword | null
  },

  async getAdminById(id: string): Promise<AdminPublic | null> {
    const admin = await prisma.admin.findUnique({
      where: { id },
    })

    return admin ? toPublic(admin as AdminWithPassword) : null
  },

  async listAdmins(options?: {
    includeInactive?: boolean
    role?: string
  }): Promise<AdminPublic[]> {
    const admins = await prisma.admin.findMany({
      where: {
        ...(options?.includeInactive ? {} : { isActive: true }),
        ...(options?.role ? { role: options.role } : {}),
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    })

    return admins.map(admin => toPublic(admin as AdminWithPassword))
  },

  async updateAdmin(id: string, input: AdminUpdateInput): Promise<AdminPublic | null> {
    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.updatedBy && { updatedBy: input.updatedBy }),
      },
    })

    return toPublic(admin as AdminWithPassword)
  },

  /**
   * 비밀번호 변경 (비밀번호 정책 및 재사용 방지 적용)
   */
  async updatePassword(id: string, newPassword: string, updatedBy?: string): Promise<{ success: boolean, error?: string }> {
    // 비밀번호 정책 검증
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    // 현재 관리자 정보 조회
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { passwordHash: true, previousPasswordHash: true },
    })

    if (!admin) {
      return { success: false, error: '관리자를 찾을 수 없습니다.' }
    }

    // 현재 비밀번호와 동일한지 확인
    const isSameAsCurrent = await bcrypt.compare(newPassword, admin.passwordHash)
    if (isSameAsCurrent) {
      return { success: false, error: '현재 비밀번호와 다른 비밀번호를 입력해주세요.' }
    }

    // 직전 비밀번호와 동일한지 확인
    if (admin.previousPasswordHash) {
      const isSameAsPrevious = await bcrypt.compare(newPassword, admin.previousPasswordHash)
      if (isSameAsPrevious) {
        return { success: false, error: '직전 비밀번호와 다른 비밀번호를 입력해주세요.' }
      }
    }

    // 새 비밀번호 해시
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // 업데이트 (현재 비밀번호를 직전 비밀번호로 이동)
    await prisma.admin.update({
      where: { id },
      data: {
        previousPasswordHash: admin.passwordHash,
        passwordHash: newPasswordHash,
        updatedBy,
      },
    })

    return { success: true }
  },

  /**
   * 비밀번호 초기화 (슈퍼관리자가 다른 관리자의 비밀번호 초기화)
   */
  async resetPassword(id: string, newPassword: string, resetBy: string): Promise<{ success: boolean, error?: string }> {
    // 비밀번호 정책 검증
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // 비밀번호 초기화 시에는 직전 비밀번호 기록을 초기화
    await prisma.admin.update({
      where: { id },
      data: {
        passwordHash,
        previousPasswordHash: null, // 초기화 시 직전 기록 삭제
        loginAttempts: 0, // 로그인 시도 횟수 초기화
        lockedUntil: null, // 잠금 해제
        updatedBy: resetBy,
      },
    })

    return { success: true }
  },

  async deleteAdmin(id: string, deletedBy?: string): Promise<boolean> {
    await prisma.admin.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: deletedBy,
      },
    })

    return true
  },

  async verifyPassword(admin: AdminWithPassword, password: string): Promise<boolean> {
    return bcrypt.compare(password, admin.passwordHash)
  },

  /**
   * 로그인 시도 횟수 증가 및 잠금 처리
   * @returns { locked: boolean, remainingAttempts: number }
   */
  async incrementLoginAttempts(id: string): Promise<{ locked: boolean, remainingAttempts: number, lockedUntil: Date | null }> {
    const maxAttempts = getMaxLoginAttempts()

    // 0이면 무제한
    if (maxAttempts === 0) {
      return { locked: false, remainingAttempts: -1, lockedUntil: null }
    }

    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { loginAttempts: true },
    })

    if (!admin) {
      return { locked: false, remainingAttempts: 0, lockedUntil: null }
    }

    const newAttempts = admin.loginAttempts + 1
    const shouldLock = newAttempts >= maxAttempts

    let lockedUntil: Date | null = null
    if (shouldLock) {
      lockedUntil = new Date(Date.now() + getLockoutMinutes() * 60 * 1000)
    }

    await prisma.admin.update({
      where: { id },
      data: {
        loginAttempts: newAttempts,
        ...(shouldLock && { lockedUntil }),
      },
    })

    return {
      locked: shouldLock,
      remainingAttempts: Math.max(0, maxAttempts - newAttempts),
      lockedUntil,
    }
  },

  /**
   * 로그인 성공 시 시도 횟수 초기화
   */
  async resetLoginAttempts(id: string): Promise<void> {
    await prisma.admin.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    })
  },

  /**
   * 계정 잠금 상태 확인
   */
  async isAccountLocked(admin: AdminWithPassword): Promise<{ locked: boolean, lockedUntil: Date | null }> {
    if (!admin.lockedUntil) {
      return { locked: false, lockedUntil: null }
    }

    // 잠금 시간이 지났으면 자동 해제
    if (new Date() > admin.lockedUntil) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
        },
      })
      return { locked: false, lockedUntil: null }
    }

    return { locked: true, lockedUntil: admin.lockedUntil }
  },

  /**
   * 수동 잠금 해제 (슈퍼관리자용)
   */
  async unlockAccount(id: string, unlockedBy: string): Promise<boolean> {
    await prisma.admin.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        updatedBy: unlockedBy,
      },
    })

    return true
  },

  async updateLastLogin(id: string, ip?: string): Promise<void> {
    await prisma.admin.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    })
  },

  async countAdmins(): Promise<{ total: number, active: number, superAdmins: number, locked: number }> {
    const [total, active, superAdmins, locked] = await Promise.all([
      prisma.admin.count(),
      prisma.admin.count({ where: { isActive: true } }),
      prisma.admin.count({ where: { role: 'super_admin', isActive: true } }),
      prisma.admin.count({
        where: {
          AND: [
            { lockedUntil: { not: null } },
            { lockedUntil: { gt: new Date() } },
          ],
        },
      }),
    ])

    return { total, active, superAdmins, locked }
  },
}
