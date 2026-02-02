'use client'

import { useEffect, useState } from 'react'
import { getOrCreateSessionId } from '@/lib/session-manager'

/**
 * 익명 사용자 세션 관리 훅
 * Phase 7: 익명 사용자 지원
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window !== 'undefined') {
      const id = getOrCreateSessionId()
      setSessionId(id)
      setIsReady(true)
    }
  }, [])

  return {
    sessionId,
    isReady,
    isAnonymous: !!sessionId,
  }
}
