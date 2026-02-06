import { errorLogRepository, type ErrorLogCreateInput } from './repositories/error-log'

class ErrorCapture {
  async capture(
    error: Error | unknown,
    context: Partial<Omit<ErrorLogCreateInput, 'errorType' | 'message' | 'stackTrace'>>,
  ) {
    try {
      const err = error instanceof Error ? error : new Error(String(error))

      await errorLogRepository.create({
        errorType: err.name || 'Error',
        errorCode: (error as any)?.code,
        message: err.message,
        stackTrace: err.stack,
        source: context.source || 'API_ROUTE',
        requestPath: context.requestPath,
        requestMethod: context.requestMethod,
        userEmpNo: context.userEmpNo,
        adminId: context.adminId,
        sessionId: context.sessionId,
        appId: context.appId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      })
    }
    catch (captureError) {
      // 에러 캡처 실패는 콘솔에만 기록
      console.error('Failed to capture error:', captureError)
      console.error('Original error:', error)
    }
  }

  // API 라우트용 헬퍼
  async captureApiError(
    error: Error | unknown,
    request: Request,
    context?: { userEmpNo?: string, adminId?: string, sessionId?: string, appId?: string },
  ) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    await this.capture(error, {
      source: 'API_ROUTE',
      requestPath: new URL(request.url).pathname,
      requestMethod: request.method,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      ...context,
    })
  }

  // 클라이언트 에러용 헬퍼
  async captureClientError(
    error: { type: string, message: string, stack?: string },
    context?: { userEmpNo?: string, sessionId?: string, appId?: string, ipAddress?: string, userAgent?: string },
  ) {
    try {
      await errorLogRepository.create({
        errorType: error.type || 'ClientError',
        message: error.message,
        stackTrace: error.stack,
        source: 'CLIENT',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        userEmpNo: context?.userEmpNo,
        sessionId: context?.sessionId,
        appId: context?.appId,
      })
    }
    catch (captureError) {
      console.error('Failed to capture client error:', captureError)
    }
  }
}

export const errorCapture = new ErrorCapture()
