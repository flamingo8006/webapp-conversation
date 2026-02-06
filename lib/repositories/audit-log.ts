import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface AuditLogCreateInput {
  actorType: 'admin' | 'user'
  actorId?: string | null
  actorLoginId: string
  actorName: string
  actorRole?: string | null
  action: string
  entityType: string
  entityId?: string | null
  changes?: Record<string, any> | null
  metadata?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
  requestPath?: string | null
  success?: boolean
  errorMessage?: string | null
}

export interface AuditLogFilter {
  actorId?: string
  actorType?: 'admin' | 'user'
  action?: string
  entityType?: string
  entityId?: string
  success?: boolean
  startDate?: Date
  endDate?: Date
}

export interface AuditLogListOptions {
  filter?: AuditLogFilter
  page?: number
  limit?: number
  orderBy?: 'asc' | 'desc'
}

export const auditLogRepository = {
  async create(input: AuditLogCreateInput) {
    return prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId,
        actorLoginId: input.actorLoginId,
        actorName: input.actorName,
        actorRole: input.actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes as Prisma.InputJsonValue,
        metadata: input.metadata as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        requestPath: input.requestPath,
        success: input.success ?? true,
        errorMessage: input.errorMessage,
      },
    })
  },

  async list(options: AuditLogListOptions = {}) {
    const { filter = {}, page = 1, limit = 50, orderBy = 'desc' } = options

    const where: Prisma.AuditLogWhereInput = {}

    if (filter.actorId)
    { where.actorId = filter.actorId }
    if (filter.actorType)
    { where.actorType = filter.actorType }
    if (filter.action)
    { where.action = filter.action }
    if (filter.entityType)
    { where.entityType = filter.entityType }
    if (filter.entityId)
    { where.entityId = filter.entityId }
    if (filter.success !== undefined)
    { where.success = filter.success }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {}
      if (filter.startDate)
      { where.createdAt.gte = filter.startDate }
      if (filter.endDate)
      { where.createdAt.lte = filter.endDate }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: orderBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
    })
  },

  async getActions() {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    })
    return actions.map(a => a.action)
  },

  async getEntityTypes() {
    const types = await prisma.auditLog.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
      orderBy: { entityType: 'asc' },
    })
    return types.map(t => t.entityType)
  },

  async getStats(days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const [total, byAction, byEntityType, failures] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { entityType: 'desc' } },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: startDate },
          success: false,
        },
      }),
    ])

    return {
      total,
      failures,
      byAction: byAction.map(a => ({ action: a.action, count: a._count })),
      byEntityType: byEntityType.map(t => ({ entityType: t.entityType, count: t._count })),
    }
  },
}
