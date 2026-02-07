/**
 * 통계 자동 집계 헬퍼 (Phase 11-1)
 * fire-and-forget 패턴: await 없이 호출, 실패해도 채팅 흐름에 영향 없음
 */

import { usageStatsRepository } from '@/lib/repositories/usage-stats'

/**
 * 메시지 통계 증분 (fire-and-forget)
 */
export function trackMessageStats(
  appId: string,
  role: 'user' | 'assistant',
  tokenCount?: number,
) {
  usageStatsRepository.incrementStats({
    date: new Date(),
    appId,
    userMessages: role === 'user' ? 1 : 0,
    assistantMessages: role === 'assistant' ? 1 : 0,
    totalTokens: tokenCount || 0,
  }).catch((err) => {
    console.warn('Stats increment failed (non-fatal):', err)
  })
}

/**
 * 피드백 통계 증분 (fire-and-forget)
 */
export function trackFeedbackStats(
  appId: string,
  rating: 'like' | 'dislike',
) {
  usageStatsRepository.incrementStats({
    date: new Date(),
    appId,
    likeFeedbacks: rating === 'like' ? 1 : 0,
    dislikeFeedbacks: rating === 'dislike' ? 1 : 0,
  }).catch((err) => {
    console.warn('Feedback stats increment failed (non-fatal):', err)
  })
}
