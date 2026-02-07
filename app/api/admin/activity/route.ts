import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import prisma from '@/lib/prisma'
import { parsePositiveInt } from '@/lib/validation'
import { errorCapture } from '@/lib/error-capture'

// 활동 내역 조회
// super_admin: 전체 활동
// admin: 본인이 생성한 챗봇의 활동만
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request)

    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const appId = searchParams.get('appId') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId') || undefined
    const userName = searchParams.get('userName') || undefined
    const page = parsePositiveInt(searchParams.get('page'), 1)
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 50), 100)

    // 기본 기간: 최근 7일
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 6)
    defaultStartDate.setHours(0, 0, 0, 0)

    const defaultEndDate = new Date()
    defaultEndDate.setHours(23, 59, 59, 999)

    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : defaultEndDate,
    }

    // super_admin은 전체, 일반 admin은 본인 앱만
    let allowedAppIds: string[] | null = null
    if (admin.role !== 'super_admin') {
      const apps = await prisma.chatbotApp.findMany({
        where: { createdBy: admin.sub, isActive: true },
        select: { id: true },
      })
      allowedAppIds = apps.map(a => a.id)
    }

    // 필터 조건 생성
    const sessionWhere: Record<string, unknown> = {}

    // 앱 필터
    if (appId) {
      // 특정 앱 지정 시 권한 체크
      if (allowedAppIds && !allowedAppIds.includes(appId)) {
        return NextResponse.json(
          { error: '해당 챗봇에 대한 권한이 없습니다.' },
          { status: 403 },
        )
      }
      sessionWhere.appId = appId
    }
    else if (allowedAppIds) {
      sessionWhere.appId = { in: allowedAppIds }
    }

    // 사용자 필터 (인증 사용자의 경우)
    if (userId) {
      sessionWhere.userLoginId = { contains: userId, mode: 'insensitive' }
    }
    if (userName) {
      sessionWhere.userName = { contains: userName, mode: 'insensitive' }
    }

    // user 메시지만 먼저 조회 (페이지네이션 적용)
    const [userMessages, totalCount] = await Promise.all([
      prisma.chatMessage.findMany({
        where: {
          role: 'user',
          createdAt: dateFilter,
          session: sessionWhere,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          session: {
            select: {
              id: true,
              appId: true,
              isAnonymous: true,
              isActive: true, // 삭제 여부 표시용
              sessionId: true,
              userId: true,
              userLoginId: true,
              userName: true,
              app: {
                select: {
                  id: true,
                  name: true,
                  nameKo: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      }),
      prisma.chatMessage.count({
        where: {
          role: 'user',
          createdAt: dateFilter,
          session: sessionWhere,
        },
      }),
    ])

    // 각 user 메시지에 대한 답변 조회 (parentMessageId로 정확한 매칭)
    const qaPairs = await Promise.all(
      userMessages.map(async (userMsg) => {
        // parentMessageId로 정확히 매칭되는 assistant 메시지 찾기
        const answer = await prisma.chatMessage.findFirst({
          where: {
            parentMessageId: userMsg.id,
            role: 'assistant',
          },
        })

        return {
          id: userMsg.id,
          question: {
            id: userMsg.id,
            createdAt: userMsg.createdAt,
            role: userMsg.role,
            content: userMsg.content,
            contentPreview: userMsg.content.length > 200 ? `${userMsg.content.substring(0, 200)}...` : userMsg.content,
          },
          answer: answer
            ? {
              id: answer.id,
              createdAt: answer.createdAt,
              role: answer.role,
              content: answer.content,
              contentPreview: answer.content.length > 200 ? `${answer.content.substring(0, 200)}...` : answer.content,
            }
            : null,
          appId: userMsg.session.appId,
          appName: userMsg.session.app.nameKo || userMsg.session.app.name,
          userId: userMsg.session.userLoginId || null,
          userName: userMsg.session.userName || null,
          isAnonymous: userMsg.session.isAnonymous,
          isDeleted: !userMsg.session.isActive, // 삭제된 대화 여부
          sessionId: userMsg.session.id,
          createdAt: userMsg.createdAt,
        }
      }),
    )

    return NextResponse.json({
      qaPairs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  }
  catch (error) {
    console.error('Get activity error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json(
      { error: '활동 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
