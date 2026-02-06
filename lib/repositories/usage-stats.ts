import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface StatsUpdateInput {
  date: Date
  appId?: string | null
  newSessions?: number
  authSessions?: number
  anonymousSessions?: number
  userMessages?: number
  assistantMessages?: number
  uniqueUsers?: number
  totalTokens?: number
  likeFeedbacks?: number
  dislikeFeedbacks?: number
}

export const usageStatsRepository = {
  // 일별 통계 업데이트 (upsert)
  async incrementStats(input: StatsUpdateInput) {
    const dateOnly = new Date(input.date)
    dateOnly.setHours(0, 0, 0, 0)

    return prisma.dailyUsageStats.upsert({
      where: {
        date_appId: {
          date: dateOnly,
          appId: input.appId || null,
        },
      },
      create: {
        date: dateOnly,
        appId: input.appId || null,
        totalSessions: (input.newSessions || 0),
        newSessions: input.newSessions || 0,
        authSessions: input.authSessions || 0,
        anonymousSessions: input.anonymousSessions || 0,
        totalMessages: (input.userMessages || 0) + (input.assistantMessages || 0),
        userMessages: input.userMessages || 0,
        assistantMessages: input.assistantMessages || 0,
        uniqueUsers: input.uniqueUsers || 0,
        totalTokens: input.totalTokens || 0,
        likeFeedbacks: input.likeFeedbacks || 0,
        dislikeFeedbacks: input.dislikeFeedbacks || 0,
      },
      update: {
        totalSessions: { increment: input.newSessions || 0 },
        newSessions: { increment: input.newSessions || 0 },
        authSessions: { increment: input.authSessions || 0 },
        anonymousSessions: { increment: input.anonymousSessions || 0 },
        totalMessages: { increment: (input.userMessages || 0) + (input.assistantMessages || 0) },
        userMessages: { increment: input.userMessages || 0 },
        assistantMessages: { increment: input.assistantMessages || 0 },
        totalTokens: { increment: input.totalTokens || 0 },
        likeFeedbacks: { increment: input.likeFeedbacks || 0 },
        dislikeFeedbacks: { increment: input.dislikeFeedbacks || 0 },
      },
    })
  },

  // 오늘 통계 가져오기
  async getTodayStats(appId?: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where: Prisma.DailyUsageStatsWhereInput = {
      date: today,
      ...(appId ? { appId } : { appId: null }),
    }

    return prisma.dailyUsageStats.findFirst({ where })
  },

  // 기간별 통계 가져오기
  // createdBy: 특정 관리자의 앱만 (null이면 전체 - super_admin용)
  async getStatsByPeriod(startDate: Date, endDate: Date, appId?: string, createdBy?: string | null) {
    // createdBy가 있으면 해당 관리자의 앱 ID 목록 조회
    let appIds: string[] | null = null
    if (createdBy) {
      const apps = await prisma.chatbotApp.findMany({
        where: { createdBy, isActive: true },
        select: { id: true },
      })
      appIds = apps.map(a => a.id)
    }

    const where: Prisma.DailyUsageStatsWhereInput = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(appId
        ? { appId }
        : createdBy
          ? { appId: { in: appIds || [] } }
          : { appId: null }),
    }

    return prisma.dailyUsageStats.findMany({
      where,
      orderBy: { date: 'asc' },
    })
  },

  // 개요 통계 (대시보드용)
  // createdBy: 특정 관리자의 앱만 (null이면 전체 - super_admin용)
  async getOverview(days: number = 7, createdBy?: string | null) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    // createdBy가 있으면 해당 관리자의 앱 ID 목록 조회
    let appIds: string[] | null = null
    if (createdBy) {
      const apps = await prisma.chatbotApp.findMany({
        where: { createdBy, isActive: true },
        select: { id: true },
      })
      appIds = apps.map(a => a.id)
    }

    // 전체 통계 (appId = null) 또는 특정 앱들의 통계
    const stats = createdBy
      ? await prisma.dailyUsageStats.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          appId: { in: appIds || [] },
        },
        orderBy: { date: 'asc' },
      })
      : await prisma.dailyUsageStats.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          appId: null,
        },
        orderBy: { date: 'asc' },
      })

    // 집계
    const totals = stats.reduce((acc, s) => ({
      sessions: acc.sessions + s.totalSessions,
      messages: acc.messages + s.totalMessages,
      users: acc.users + s.uniqueUsers,
      tokens: acc.tokens + s.totalTokens,
    }), { sessions: 0, messages: 0, users: 0, tokens: 0 })

    return {
      period: { startDate, endDate, days },
      totals,
      daily: stats,
    }
  },

  // 앱별 통계 (순위용)
  // createdBy: 특정 관리자의 앱만 (null이면 전체 - super_admin용)
  async getAppRanking(days: number = 7, limit: number = 10, createdBy?: string | null) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    // createdBy가 있으면 해당 관리자의 앱 ID 목록 조회
    let appIds: string[] | null = null
    if (createdBy) {
      const apps = await prisma.chatbotApp.findMany({
        where: { createdBy, isActive: true },
        select: { id: true },
      })
      appIds = apps.map(a => a.id)
    }

    const stats = await prisma.dailyUsageStats.groupBy({
      by: ['appId'],
      where: {
        date: { gte: startDate },
        appId: { not: null },
        ...(createdBy ? { appId: { in: appIds || [] } } : {}),
      },
      _sum: {
        totalMessages: true,
        totalSessions: true,
        totalTokens: true,
      },
      orderBy: {
        _sum: {
          totalMessages: 'desc',
        },
      },
      take: limit,
    })

    // 앱 이름 조회
    const statAppIds = stats.map(s => s.appId).filter((id): id is string => id !== null)
    const apps = await prisma.chatbotApp.findMany({
      where: { id: { in: statAppIds } },
      select: { id: true, nameKo: true, nameEn: true, name: true },
    })

    const appMap = new Map(apps.map(a => [a.id, a]))

    return stats.map(s => ({
      appId: s.appId,
      app: s.appId ? appMap.get(s.appId) : null,
      totalMessages: s._sum.totalMessages || 0,
      totalSessions: s._sum.totalSessions || 0,
      totalTokens: s._sum.totalTokens || 0,
    }))
  },

  // 실시간 통계 (DB에서 직접 계산)
  // createdBy: 특정 관리자의 앱만 (null이면 전체 - super_admin용)
  async getRealTimeStats(createdBy?: string | null) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // createdBy가 있으면 해당 관리자의 앱 ID 목록 조회
    let appIds: string[] | null = null
    if (createdBy) {
      const apps = await prisma.chatbotApp.findMany({
        where: { createdBy, isActive: true },
        select: { id: true },
      })
      appIds = apps.map(a => a.id)
    }

    const appFilter = createdBy ? { appId: { in: appIds || [] } } : {}
    const sessionAppFilter = createdBy ? { session: { appId: { in: appIds || [] } } } : {}

    const [todaySessions, todayMessages, activeApps, recentMessages] = await Promise.all([
      prisma.chatSession.count({
        where: { createdAt: { gte: today }, ...appFilter },
      }),
      prisma.chatMessage.count({
        where: { createdAt: { gte: today }, ...sessionAppFilter },
      }),
      prisma.chatbotApp.count({
        where: { isActive: true, ...(createdBy ? { createdBy } : {}) },
      }),
      prisma.chatMessage.findMany({
        where: { createdAt: { gte: today }, ...sessionAppFilter },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          session: {
            include: {
              app: { select: { nameKo: true, nameEn: true, name: true } },
            },
          },
        },
      }),
    ])

    return {
      todaySessions,
      todayMessages,
      activeApps,
      recentMessages: recentMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 100),
        appName: m.session.app.nameKo || m.session.app.name,
        createdAt: m.createdAt,
      })),
    }
  },

  // 통계 재계산 (배치용)
  async recalculateStats(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // 앱별 통계 계산
    const apps = await prisma.chatbotApp.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    for (const app of apps) {
      const [sessions, messages, feedback] = await Promise.all([
        prisma.chatSession.groupBy({
          by: ['isAnonymous'],
          where: {
            appId: app.id,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          _count: true,
        }),
        prisma.chatMessage.groupBy({
          by: ['role'],
          where: {
            session: { appId: app.id },
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          _count: true,
          _sum: { tokenCount: true },
        }),
        prisma.chatMessage.groupBy({
          by: ['feedback'],
          where: {
            session: { appId: app.id },
            createdAt: { gte: startOfDay, lte: endOfDay },
            feedback: { not: null },
          },
          _count: true,
        }),
      ])

      const authSessions = sessions.find(s => !s.isAnonymous)?._count || 0
      const anonymousSessions = sessions.find(s => s.isAnonymous)?._count || 0
      const userMessages = messages.find(m => m.role === 'user')?._count || 0
      const assistantMessages = messages.find(m => m.role === 'assistant')?._count || 0
      const totalTokens = messages.reduce((sum, m) => sum + (m._sum.tokenCount || 0), 0)
      const likeFeedbacks = feedback.find(f => f.feedback === 'like')?._count || 0
      const dislikeFeedbacks = feedback.find(f => f.feedback === 'dislike')?._count || 0

      await prisma.dailyUsageStats.upsert({
        where: {
          date_appId: { date: startOfDay, appId: app.id },
        },
        create: {
          date: startOfDay,
          appId: app.id,
          totalSessions: authSessions + anonymousSessions,
          newSessions: authSessions + anonymousSessions,
          authSessions,
          anonymousSessions,
          totalMessages: userMessages + assistantMessages,
          userMessages,
          assistantMessages,
          totalTokens,
          likeFeedbacks,
          dislikeFeedbacks,
        },
        update: {
          totalSessions: authSessions + anonymousSessions,
          newSessions: authSessions + anonymousSessions,
          authSessions,
          anonymousSessions,
          totalMessages: userMessages + assistantMessages,
          userMessages,
          assistantMessages,
          totalTokens,
          likeFeedbacks,
          dislikeFeedbacks,
        },
      })
    }

    // 전체 통계 (appId = null)
    const [totalSessions, totalMessages, feedback] = await Promise.all([
      prisma.chatSession.groupBy({
        by: ['isAnonymous'],
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _count: true,
      }),
      prisma.chatMessage.groupBy({
        by: ['role'],
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _count: true,
        _sum: { tokenCount: true },
      }),
      prisma.chatMessage.groupBy({
        by: ['feedback'],
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          feedback: { not: null },
        },
        _count: true,
      }),
    ])

    const authSessions = totalSessions.find(s => !s.isAnonymous)?._count || 0
    const anonymousSessions = totalSessions.find(s => s.isAnonymous)?._count || 0
    const userMessages = totalMessages.find(m => m.role === 'user')?._count || 0
    const assistantMessages = totalMessages.find(m => m.role === 'assistant')?._count || 0
    const totalTokens = totalMessages.reduce((sum, m) => sum + (m._sum.tokenCount || 0), 0)
    const likeFeedbacks = feedback.find(f => f.feedback === 'like')?._count || 0
    const dislikeFeedbacks = feedback.find(f => f.feedback === 'dislike')?._count || 0

    await prisma.dailyUsageStats.upsert({
      where: {
        date_appId: { date: startOfDay, appId: null },
      },
      create: {
        date: startOfDay,
        appId: null,
        totalSessions: authSessions + anonymousSessions,
        newSessions: authSessions + anonymousSessions,
        authSessions,
        anonymousSessions,
        totalMessages: userMessages + assistantMessages,
        userMessages,
        assistantMessages,
        totalTokens,
        likeFeedbacks,
        dislikeFeedbacks,
      },
      update: {
        totalSessions: authSessions + anonymousSessions,
        newSessions: authSessions + anonymousSessions,
        authSessions,
        anonymousSessions,
        totalMessages: userMessages + assistantMessages,
        userMessages,
        assistantMessages,
        totalTokens,
        likeFeedbacks,
        dislikeFeedbacks,
      },
    })
  },
}
