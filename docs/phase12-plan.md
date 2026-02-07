# Phase 12: 구조화된 로깅 시스템

**작성일**: 2026-02-07
**상태**: 계획 수립 완료, 작업 대기

---

## 개요

모든 API 라우트와 핵심 라이브러리의 `console.error/warn/log`를 **구조화된 로거**로 교체하여:
1. **Request ID** 기반 요청 추적 가능
2. **로그 레벨** 체계적 관리 (error > warn > info > debug)
3. **구조화된 컨텍스트** (JSON 형태로 IP, 경로, 사용자 정보 등 자동 포함)
4. **환경별 출력** (개발: 읽기 쉬운 포맷, 프로덕션: JSON)

---

## 현재 상태 분석

### console 사용 현황

| 영역 | 파일 수 | console 호출 수 | 패턴 |
|------|---------|----------------|------|
| API 라우트 (`app/api/`) | 34개 | 46회 | `console.error('메시지:', error)` |
| 라이브러리 (`lib/`) | 7개 | 11회 | `console.error/warn('메시지:', error)` |
| **합계** | **41개** | **57회** | |

### 현재 문제점

1. **비구조화**: 단순 문자열 + 에러 객체 출력, 파싱/검색 어려움
2. **컨텍스트 부족**: 어떤 요청, 어떤 사용자, 어떤 앱에서 발생했는지 추적 불가
3. **Request ID 없음**: 같은 요청의 여러 로그를 연결할 수 없음
4. **레벨 비일관**: error/warn이 혼재, 명확한 기준 없음
5. **기존 시스템과 중복**: `errorCapture`(DB 저장)와 `console.error`가 별도로 동작

---

## Git 전략

Phase 10/11과 동일하게 개별 커밋으로 분리:

```
claude/review-progress-ughKp (현재)
  ├── 커밋 A: Phase 12-1 로거 모듈 생성
  ├── 커밋 B: Phase 12-2 API 라우트에 로거 적용
  └── 커밋 C: Phase 12-3 라이브러리에 로거 적용
```

---

## Phase 12-1: 로거 모듈 생성

### 목표
외부 라이브러리 없이 자체 로거 클래스 생성 (의존성 최소화)

### 위험도: 매우 낮음
- **수정 범위**: 새 파일 1개 생성
- **기존 코드 변경 없음**

### 설계

```
lib/logger.ts (새로 생성)
```

#### 핵심 기능

1. **로그 레벨**: `debug`, `info`, `warn`, `error`
2. **Request ID**: 미들웨어에서 `x-request-id` 헤더로 전달
3. **구조화된 출력**: 타임스탬프 + 레벨 + 메시지 + 컨텍스트 (JSON)
4. **환경별 포맷**:
   - 개발 (`NODE_ENV !== 'production'`): 가독성 좋은 컬러 포맷
   - 프로덕션 (`NODE_ENV === 'production'`): JSON 한 줄 (로그 수집 도구 호환)

#### API 설계

```typescript
// 기본 사용
logger.error('Chat message error', { appId, userId, error })
logger.warn('Rate limit approaching', { appId, remaining: 5 })
logger.info('New session created', { sessionId, appId })
logger.debug('Dify API response', { conversationId, status })

// Request 컨텍스트 포함 (API 라우트용)
logger.error('Chat message error', {
  requestId: request.headers.get('x-request-id'),
  path: '/api/apps/xxx/chat-messages',
  method: 'POST',
  appId,
  error,
})

// 편의 메서드: request에서 컨텍스트 자동 추출
logger.apiError(request, 'Chat message error', { appId, error })
logger.apiInfo(request, 'Session created', { sessionId })
```

#### 출력 예시

**개발 모드**:
```
[2026-02-07 14:30:15] ERROR [req_abc123] Chat message error
  → path: /api/apps/xxx/chat-messages
  → appId: clx1234
  → error: Connection timeout
```

**프로덕션 모드**:
```json
{"timestamp":"2026-02-07T14:30:15.123Z","level":"error","requestId":"req_abc123","message":"Chat message error","path":"/api/apps/xxx/chat-messages","appId":"clx1234","error":"Connection timeout"}
```

### 검증
- [ ] `pnpm build` 성공
- [ ] 새 파일만 생성, 기존 코드 변경 없음

### 복구 방법
```bash
git revert <Phase12-1 커밋해시>
```
새 파일 삭제만으로 완전 복구.

---

## Phase 12-2: API 라우트에 로거 적용

### 목표
34개 API 라우트 파일의 `console.error/warn` → `logger.apiError/apiWarn` 교체

### 위험도: 낮음
- **수정 범위**: 34개 API 라우트 파일, 46개 console 호출
- **런타임 영향**: 로그 출력 포맷만 변경, 비즈니스 로직 무관
- **기존 errorCapture 유지**: `errorCapture.captureApiError()`는 그대로 (DB 저장)

### 변경 패턴

```typescript
// Before
import { errorCapture } from '@/lib/error-capture'

export async function GET(request: NextRequest) {
  try {
    // ...
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get apps error:', error)
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// After
import { errorCapture } from '@/lib/error-capture'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // ...
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.apiError(request, 'Get apps error', { error })
    errorCapture.captureApiError(error, request).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

### 대상 파일 (34개)

**관리자 API (18개)**:

| # | 파일 | console 호출 수 |
|---|------|----------------|
| 1 | `app/api/admin/apps/route.ts` | 2 |
| 2 | `app/api/admin/apps/[appId]/route.ts` | 3 |
| 3 | `app/api/admin/admins/route.ts` | 2 |
| 4 | `app/api/admin/admins/[id]/route.ts` | 3 |
| 5 | `app/api/admin/admins/[id]/unlock/route.ts` | 1 |
| 6 | `app/api/admin/admins/[id]/reset-password/route.ts` | 1 |
| 7 | `app/api/admin/auth/login/route.ts` | 1 |
| 8 | `app/api/admin/auth/logout/route.ts` | 1 |
| 9 | `app/api/admin/auth/me/route.ts` | 2 |
| 10 | `app/api/admin/auth/password/route.ts` | 1 |
| 11 | `app/api/admin/stats/overview/route.ts` | 1 |
| 12 | `app/api/admin/stats/trend/route.ts` | 1 |
| 13 | `app/api/admin/stats/recalculate/route.ts` | 1 |
| 14 | `app/api/admin/errors/route.ts` | 1 |
| 15 | `app/api/admin/errors/stats/route.ts` | 1 |
| 16 | `app/api/admin/errors/[id]/route.ts` | 2 |
| 17 | `app/api/admin/audit-logs/route.ts` | 1 |
| 18 | `app/api/admin/audit-logs/stats/route.ts` | 1 |
| 19 | `app/api/admin/activity/route.ts` | 1 |

**앱 API (9개)**:

| # | 파일 | console 호출 수 |
|---|------|----------------|
| 20 | `app/api/apps/[appId]/chat-messages/route.ts` | 3 |
| 21 | `app/api/apps/[appId]/conversations/route.ts` | 1 |
| 22 | `app/api/apps/[appId]/messages/route.ts` | 1 |
| 23 | `app/api/apps/[appId]/parameters/route.ts` | 1 |
| 24 | `app/api/apps/[appId]/file-upload/route.ts` | 1 |
| 25 | `app/api/apps/[appId]/info/route.ts` | 1 |
| 26 | `app/api/apps/[appId]/sessions/route.ts` | 2 |
| 27 | `app/api/apps/[appId]/sessions/[sessionId]/route.ts` | 2 |
| 28 | `app/api/apps/public/route.ts` | 1 |

**인증/기타 API (6개)**:

| # | 파일 | console 호출 수 |
|---|------|----------------|
| 29 | `app/api/auth/login/route.ts` | 1 |
| 30 | `app/api/auth/token/route.ts` | 1 |
| 31 | `app/api/auth/verify/route.ts` | 1 |
| 32 | `app/api/auth/embed-token/route.ts` | 1 |
| 33 | `app/api/errors/report/route.ts` | 1 |
| 34 | `app/api/conversations/[conversationId]/name/route.ts` | 1 (warn) |

### 검증
- [ ] `pnpm build` 성공
- [ ] import 문이 올바르게 추가되었는지 확인
- [ ] 기존 `errorCapture` 호출이 제거되지 않았는지 확인
- [ ] 기존 응답 포맷(JSON 구조, status 코드) 변경 없는지 확인

### 복구 방법
```bash
git revert <Phase12-2 커밋해시>
```
logger 호출이 console 호출로 복원됨. 비즈니스 로직 영향 없음.

---

## Phase 12-3: 라이브러리에 로거 적용

### 목표
`lib/` 디렉토리의 핵심 모듈들에서 console → logger 교체

### 위험도: 낮음
- **수정 범위**: 7개 파일, 11개 console 호출
- **주의**: `error-capture.ts`, `audit-logger.ts`는 자체 에러 핸들링용 console을 사용 (순환 참조 주의)

### 대상 파일 (7개)

| # | 파일 | 호출 수 | 비고 |
|---|------|---------|------|
| 1 | `lib/stats-helper.ts` | 2 | `console.warn` → `logger.warn` |
| 2 | `lib/auth-utils.ts` | 1 | `console.error` → `logger.error` |
| 3 | `lib/legacy-auth.ts` | 1 | `console.error` → `logger.error` |
| 4 | `lib/admin-auth.ts` | 1 | `console.error` → `logger.error` |
| 5 | `lib/jwt.ts` | 1 | `console.error` → `logger.error` |
| 6 | `lib/repositories/chatbot-app.ts` | 1 | `console.error` → `logger.error` |
| 7 | `lib/error-capture.ts` | 3 | `console.error` → `logger.error` (순환 참조 없음: logger는 DB 사용 안 함) |

**제외**: `lib/audit-logger.ts` (1개)
- audit-logger의 `console.error`는 "감사 로그 실패 시" 최후의 안전장치
- logger로 교체해도 무방하지만, audit-logger는 이미 잘 동작하므로 제외

### 검증
- [ ] `pnpm build` 성공
- [ ] 순환 참조 없는지 확인 (logger → error-capture → logger 방지)
- [ ] 기존 동작 변경 없는지 확인

### 복구 방법
```bash
git revert <Phase12-3 커밋해시>
```

---

## Phase 12-4: 미들웨어에 Request ID 추가

### 목표
미들웨어에서 모든 요청에 `x-request-id` UUID 부여

### 위험도: 낮음
- **수정 범위**: `middleware.ts` 1개 파일
- **영향**: 모든 요청 헤더에 `x-request-id` 추가 (기존 동작 무관)

### 변경 내용

```typescript
// middleware.ts 상단에 추가
function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

// middleware 함수 시작부에 추가
const requestId = generateRequestId()
// NextResponse.next() 호출 시 requestHeaders에 추가
requestHeaders.set('x-request-id', requestId)
```

### 주의사항
- middleware.ts는 Edge Runtime → `crypto.randomUUID()` 사용 가능
- 기존 `NextResponse.next()` 호출이 여러 곳에 있으므로 모든 분기에 적용
- 공개 경로의 `NextResponse.next()`에도 request ID 추가 필요

### 검증
- [ ] `pnpm build` 성공
- [ ] 모든 `NextResponse.next()` 분기에 request ID가 포함되는지 확인

### 복구 방법
```bash
git revert <Phase12-4 커밋해시>
```
request ID 헤더 제거만으로 완전 복구. 기존 인증/라우팅 영향 없음.

---

## 전체 작업 순서 및 체크리스트

### Step 1: Phase 12-1 (로거 모듈 생성)
- [ ] `lib/logger.ts` 생성
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: create structured logger module (Phase 12-1)`

### Step 2: Phase 12-2 (API 라우트에 로거 적용)
- [ ] 34개 API 라우트 파일에 logger 적용
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `refactor: replace console.error with structured logger in API routes (Phase 12-2)`

### Step 3: Phase 12-3 (라이브러리에 로거 적용)
- [ ] 7개 lib 파일에 logger 적용
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `refactor: replace console.error with structured logger in lib modules (Phase 12-3)`

### Step 4: Phase 12-4 (Request ID 미들웨어)
- [ ] `middleware.ts`에 request ID 생성 로직 추가
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: add request ID generation in middleware (Phase 12-4)`

### Step 5: 최종
- [ ] CLAUDE.md 업데이트
- [ ] `pnpm build` 최종 확인
- [ ] 푸시: `git push -u origin claude/review-progress-ughKp`

---

## 비상 복구 절차

### 특정 Phase만 롤백
```bash
git revert <커밋해시> --no-edit
git push -u origin claude/review-progress-ughKp
```

### Phase 12-1 롤백 시
- logger.ts 파일 삭제만으로 복구
- Phase 12-2, 12-3도 함께 롤백 필요 (의존 관계)

### Phase 12-2 롤백 시
- API 라우트의 logger → console 복원
- Phase 12-1 (로거 모듈)은 유지해도 무방

### Phase 12-3 롤백 시
- lib 파일의 logger → console 복원
- Phase 12-1 (로거 모듈)은 유지해도 무방

### Phase 12-4 롤백 시
- middleware에서 request ID 생성 제거
- 다른 Phase에 영향 없음 (logger는 requestId 없으면 생략)

---

## 외부 라이브러리 미채택 사유

| 라이브러리 | 미채택 사유 |
|-----------|-----------|
| **pino** | 고성능이지만 Next.js Edge Runtime 호환성 불확실, 번들 사이즈 증가 |
| **winston** | Node.js 전용, Edge Runtime 미지원 |
| **bunyan** | 유지보수 중단 |

**자체 구현 선택 이유**:
- 프로젝트 규모에 비해 외부 의존성 과도
- Edge Runtime 호환성 보장
- 필요한 기능이 간단 (레벨 분리 + JSON 포맷 + Request ID)
- 추후 외부 라이브러리로 교체 용이한 인터페이스 설계
