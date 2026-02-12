import type { NextRequest } from 'next/server'
import { getChatbotAppWithKey } from '@/lib/repositories/chatbot-app'
import { apiNotFound, apiInternalError } from '@/lib/api-response'
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

/**
 * GET /api/apps/{appId}/files/{...path}
 *
 * Dify 파일 프록시 API
 * 브라우저 → Next.js → Dify 파일 서버 → 브라우저 (스트리밍)
 *
 * Dify 서버가 내부망에 위치하여 브라우저에서 직접 접근 불가.
 * Next.js 서버가 Dify에서 파일을 가져와 브라우저에 스트리밍으로 전달.
 *
 * 인증 불필요: 브라우저 <img> 태그 등 직접 요청 시 커스텀 헤더 전송 불가.
 * Dify 파일 URL 자체에 sign/timestamp 보안 포함되어 있으므로
 * 앱 존재 여부만 확인하고 Dify에 위임.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string, path: string[] }> },
) {
  try {
    const { appId, path } = await params

    // 챗봇 앱 조회 + API Key 복호화
    const app = await getChatbotAppWithKey(appId)
    if (!app) {
      return apiNotFound('App not found')
    }

    // Dify 베이스 URL 추출 (/v1 제거)
    const difyBaseUrl = app.apiUrl?.replace(/\/v1\/?$/, '') || ''
    if (!difyBaseUrl) {
      logger.apiError(request, 'Dify base URL not configured', { appId })
      return apiInternalError('File service not configured')
    }

    // Dify 파일 URL 조합
    const filePath = path.join('/')
    const queryString = request.nextUrl.search // ?timestamp=...&sign=... 등
    const difyFileUrl = `${difyBaseUrl}/files/${filePath}${queryString}`

    // Dify에 파일 요청 (API Key 인증)
    const difyResponse = await fetch(difyFileUrl, {
      headers: {
        Authorization: `Bearer ${app.apiKey}`,
      },
    })

    if (!difyResponse.ok) {
      if (difyResponse.status === 404) {
        return apiNotFound('File not found')
      }
      logger.apiWarn(request, 'Dify file fetch failed', {
        appId,
        filePath,
        status: difyResponse.status,
      })
      return apiInternalError('Failed to fetch file')
    }

    // 응답 헤더 구성
    const headers = new Headers()

    const contentType = difyResponse.headers.get('content-type')
    if (contentType)
    { headers.set('Content-Type', contentType) }

    const contentLength = difyResponse.headers.get('content-length')
    if (contentLength)
    { headers.set('Content-Length', contentLength) }

    const contentDisposition = difyResponse.headers.get('content-disposition')
    if (contentDisposition)
    { headers.set('Content-Disposition', contentDisposition) }

    // 파일은 불변이므로 적극적 캐싱
    headers.set('Cache-Control', 'public, max-age=86400, immutable')

    // Dify 응답 body를 그대로 스트리밍 전달 (메모리 버퍼링 없음)
    return new Response(difyResponse.body, {
      status: 200,
      headers,
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'File proxy error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return apiInternalError(message)
  }
}
