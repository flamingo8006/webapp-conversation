import prisma from '@/lib/prisma'

export interface AdminGroupCreateInput {
  name: string
  description?: string
  createdBy?: string
}

export interface AdminGroupUpdateInput {
  name?: string
  description?: string
  isActive?: boolean
  updatedBy?: string
}

export interface AdminGroupPublic {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  createdBy: string | null
  updatedAt: Date
  updatedBy: string | null
  _count?: {
    members: number
    apps: number
  }
}

export interface AdminGroupMember {
  id: string
  loginId: string
  name: string
  email: string | null
  department: string | null
  role: string
  groupRole: string
  isActive: boolean
}

export const adminGroupRepository = {
  async createGroup(input: AdminGroupCreateInput): Promise<AdminGroupPublic> {
    const group = await prisma.adminGroup.create({
      data: {
        name: input.name,
        description: input.description,
        createdBy: input.createdBy,
      },
      include: {
        _count: {
          select: { members: true, apps: true },
        },
      },
    })

    return group
  },

  async getGroupById(id: string): Promise<AdminGroupPublic | null> {
    const group = await prisma.adminGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, apps: true },
        },
      },
    })

    return group
  },

  async listGroups(options?: {
    includeInactive?: boolean
  }): Promise<AdminGroupPublic[]> {
    const groups = await prisma.adminGroup.findMany({
      where: {
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: { members: true, apps: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return groups
  },

  async updateGroup(id: string, input: AdminGroupUpdateInput): Promise<AdminGroupPublic> {
    const group = await prisma.adminGroup.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.updatedBy && { updatedBy: input.updatedBy }),
      },
      include: {
        _count: {
          select: { members: true, apps: true },
        },
      },
    })

    return group
  },

  async deleteGroup(id: string, deletedBy?: string): Promise<boolean> {
    // 소프트 삭제: 멤버들의 groupId를 null로 변경하고 그룹 비활성화
    await prisma.$transaction([
      prisma.admin.updateMany({
        where: { groupId: id },
        data: { groupId: null, groupRole: 'member' },
      }),
      prisma.chatbotApp.updateMany({
        where: { groupId: id },
        data: { groupId: null },
      }),
      prisma.adminGroup.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: deletedBy,
        },
      }),
    ])

    return true
  },

  async addMember(groupId: string, adminId: string, groupRole: string = 'member'): Promise<AdminGroupMember> {
    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        groupId,
        groupRole,
      },
    })

    return {
      id: admin.id,
      loginId: admin.loginId,
      name: admin.name,
      email: admin.email,
      department: admin.department,
      role: admin.role,
      groupRole: admin.groupRole,
      isActive: admin.isActive,
    }
  },

  async removeMember(adminId: string): Promise<boolean> {
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        groupId: null,
        groupRole: 'member',
      },
    })

    return true
  },

  async updateMemberRole(adminId: string, groupRole: string): Promise<AdminGroupMember> {
    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { groupRole },
    })

    return {
      id: admin.id,
      loginId: admin.loginId,
      name: admin.name,
      email: admin.email,
      department: admin.department,
      role: admin.role,
      groupRole: admin.groupRole,
      isActive: admin.isActive,
    }
  },

  async listGroupApps(groupId: string) {
    const apps = await prisma.chatbotApp.findMany({
      where: { groupId, isActive: true },
      select: {
        id: true,
        name: true,
        nameKo: true,
        nameEn: true,
        difyAppId: true,
        isPublic: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return apps
  },

  async listMembers(groupId: string): Promise<AdminGroupMember[]> {
    const admins = await prisma.admin.findMany({
      where: { groupId, isActive: true },
      orderBy: [
        { groupRole: 'asc' },
        { name: 'asc' },
      ],
    })

    return admins.map(admin => ({
      id: admin.id,
      loginId: admin.loginId,
      name: admin.name,
      email: admin.email,
      department: admin.department,
      role: admin.role,
      groupRole: admin.groupRole,
      isActive: admin.isActive,
    }))
  },
}
