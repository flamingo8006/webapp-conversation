type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  requestId?: string | null
  path?: string
  method?: string
  appId?: string
  userId?: string
  adminId?: string
  sessionId?: string
  ip?: string
  error?: unknown
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isProduction = process.env.NODE_ENV === 'production'
const minLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug')]

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message
  }
  return String(error)
}

function formatContextValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack, name: value.name }
  }
  return value
}

function logJson(level: LogLevel, message: string, context: LogContext) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) {
      entry[key] = formatContextValue(value)
    }
  }

  const output = JSON.stringify(entry)
  if (level === 'error') {
    process.stderr.write(`${output}\n`)
  }
  else {
    process.stdout.write(`${output}\n`)
  }
}

function logPretty(level: LogLevel, message: string, context: LogContext) {
  const time = new Date().toISOString().slice(11, 23)
  const levelTag = level.toUpperCase().padEnd(5)
  const reqId = context.requestId ? ` [${context.requestId}]` : ''

  const prefix = `[${time}] ${levelTag}${reqId} ${message}`

  // Build detail lines from context
  const details: string[] = []
  for (const [key, value] of Object.entries(context)) {
    if (key === 'requestId' || value === undefined || value === null) { continue }
    if (key === 'error') {
      details.push(`  → error: ${formatError(value)}`)
    }
    else {
      details.push(`  → ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    }
  }

  const output = details.length > 0 ? `${prefix}\n${details.join('\n')}` : prefix

  if (level === 'error') {
    console.error(output)
  }
  else if (level === 'warn') {
    console.warn(output)
  }
  else {
    console.log(output)
  }
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (LOG_LEVELS[level] < minLevel) { return }

  if (isProduction) {
    logJson(level, message, context)
  }
  else {
    logPretty(level, message, context)
  }
}

function extractRequestContext(request: Request): LogContext {
  const url = new URL(request.url)
  return {
    requestId: request.headers.get('x-request-id'),
    path: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || undefined,
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    log('debug', message, context)
  },

  info(message: string, context?: LogContext) {
    log('info', message, context)
  },

  warn(message: string, context?: LogContext) {
    log('warn', message, context)
  },

  error(message: string, context?: LogContext) {
    log('error', message, context)
  },

  /** API 라우트용: request에서 컨텍스트 자동 추출 */
  apiError(request: Request, message: string, context?: LogContext) {
    log('error', message, { ...extractRequestContext(request), ...context })
  },

  apiWarn(request: Request, message: string, context?: LogContext) {
    log('warn', message, { ...extractRequestContext(request), ...context })
  },

  apiInfo(request: Request, message: string, context?: LogContext) {
    log('info', message, { ...extractRequestContext(request), ...context })
  },

  apiDebug(request: Request, message: string, context?: LogContext) {
    log('debug', message, { ...extractRequestContext(request), ...context })
  },
}
