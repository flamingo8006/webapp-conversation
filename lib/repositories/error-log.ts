import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type ErrorStatus = 'new' | 'investigating' | 'resolved' | 'ignored'

export interface ErrorLogCreateInput {
  errorType: string
  errorCode?: string | null
  message: string
  stackTrace?: string | null
  source: 'API_ROUTE' | 'MIDDLEWARE' | 'CLIENT'
  requestPath?: string | null
  requestMethod?: string | null
  userEmpNo?: string | null
  adminId?: string | null
  sessionId?: string | null
  appId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface ErrorLogFilter {
  errorType?: string
  source?: string
  status?: ErrorStatus
  appId?: string
  startDate?: Date
  endDate?: Date
}

export interface ErrorLogListOptions {
  filter?: ErrorLogFilter
  page?: number
  limit?: number
}

export const errorLogRepository = {
  async create(input: ErrorLogCreateInput) {
    return prisma.errorLog.create({
      data: {
        errorType: input.errorType,
        errorCode: input.errorCode,
        message: input.message,
        stackTrace: input.stackTrace,
        source: input.source,
        requestPath: input.requestPath,
        requestMethod: input.requestMethod,
        userEmpNo: input.userEmpNo,
        adminId: input.adminId,
        sessionId: input.sessionId,
        appId: input.appId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
  },

  async list(options: ErrorLogListOptions = {}) {
    const { filter = {}, page = 1, limit = 50 } = options

    const where: Prisma.ErrorLogWhereInput = {}

    if (filter.errorType)
    { where.errorType = filter.errorType }
    if (filter.source)
    { where.source = filter.source }
    if (filter.status)
    { where.status = filter.status }
    if (filter.appId)
    { where.appId = filter.appId }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {}
      if (filter.startDate)
      { where.createdAt.gte = filter.startDate }
      if (filter.endDate)
      { where.createdAt.lte = filter.endDate }
    }

    const [total, errors] = await Promise.all([
      prisma.errorLog.count({ where }),
      prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      errors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getById(id: string) {
    return prisma.errorLog.findUnique({
      where: { id },
    })
  },

  async updateStatus(id: string, status: ErrorStatus, resolvedBy?: string, resolution?: string) {
    const data: Prisma.ErrorLogUpdateInput = { status }

    if (status === 'resolved') {
      data.resolvedAt = new Date()
      data.resolvedBy = resolvedBy
      data.resolution = resolution
    }

    return prisma.errorLog.update({
      where: { id },
      data,
    })
  },

  async getStats(days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const [total, newCount, byType, bySource] = await Promise.all([
      prisma.errorLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.errorLog.count({
        where: {
          createdAt: { gte: startDate },
          status: 'new',
        },
      }),
      prisma.errorLog.groupBy({
        by: ['errorType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { errorType: 'desc' } },
        take: 10,
      }),
      prisma.errorLog.groupBy({
        by: ['source'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ])

    return {
      total,
      newCount,
      byType: byType.map(t => ({ type: t.errorType, count: t._count })),
      bySource: bySource.map(s => ({ source: s.source, count: s._count })),
    }
  },

  async getErrorTypes() {
    const types = await prisma.errorLog.findMany({
      select: { errorType: true },
      distinct: ['errorType'],
      orderBy: { errorType: 'asc' },
    })
    return types.map(t => t.errorType)
  },
}
