# Phase 11: 통계 자동 집계 + 에러 캡처 자동화

**작성일**: 2026-02-07
**상태**: 계획 수립 완료, 작업 대기

---

## 개요

1. **통계 자동 집계**: 메시지 전송/세션 생성 시 `DailyUsageStats`를 자동 업데이트
2. **에러 캡처 자동화**: 모든 API catch 블록에 `errorCapture.captureApiError()` 연동

---

## Git 전략

Phase 10과 동일하게 개별 커밋으로 분리:

```
claude/review-progress-ughKp (현재)
  ├── 커밋 A: Phase 11-1 통계 자동 집계
  └── 커밋 B: Phase 11-2 에러 캡처 자동화
```

---

## Phase 11-1: 통계 데이터 자동 집계

### 목표
메시지 전송 시 `DailyUsageStats` 테이블을 자동으로 증분 업데이트하여,
대시보드에서 매번 실시간 쿼리를 하지 않아도 통계 확인 가능

### 현재 상태
- `usageStatsRepository.incrementStats()` 함수가 존재하지만 **어디에서도 호출하지 않음**
- 대시보드는 `getRealTimeStats()`로 ChatSession/ChatMessage 테이블을 **매번 직접 집계**
- 수동 재계산(`POST /api/admin/stats/recalculate`)만 가능

### 위험도: 낮음~중간
- **수정 범위**: `chat-messages/route.ts` (1개 파일 - 가장 핵심 API)
- **위험 요인**: 채팅 메시지 전송 흐름에 코드 추가
- **완화 방안**: fire-and-forget 패턴 (await 없이 호출, 실패해도 채팅 영향 없음)

### 설계 방식: Inline Increment (이벤트 기반)

```
사용자 메시지 전송 → Dify API 응답 → DB 메시지 저장 → 통계 증분 (비동기, 실패 무시)
```

**Cron Job 미채택 사유**:
- Next.js에서 안정적 Cron 구현이 까다로움 (서버리스 환경 제약)
- 이미 `recalculateStats()`로 수동 재계산 가능 (보정용)
- 인라인 증분이 더 실시간적이고 간단

### 작업 내역

#### 1-1. 통계 증분 헬퍼 함수 생성

```
lib/stats-helper.ts (새로 생성)
```

```typescript
// fire-and-forget 패턴: await 없이 호출, 실패 시 콘솔 경고만
export function trackMessageStats(appId: string, role: 'user' | 'assistant', isAnonymous: boolean, tokenCount?: number) {
  usageStatsRepository.incrementStats({
    date: new Date(),
    appId,
    totalMessages: 1,
    userMessages: role === 'user' ? 1 : 0,
    assistantMessages: role === 'assistant' ? 1 : 0,
    totalTokens: tokenCount || 0,
  }).catch((err) => {
    console.warn('Stats increment failed (non-fatal):', err)
  })
}

export function trackSessionStats(appId: string, isAnonymous: boolean, isNew: boolean) {
  usageStatsRepository.incrementStats({
    date: new Date(),
    appId,
    totalSessions: isNew ? 1 : 0,
    newSessions: isNew ? 1 : 0,
    authSessions: (!isAnonymous && isNew) ? 1 : 0,
    anonymousSessions: (isAnonymous && isNew) ? 1 : 0,
  }).catch((err) => {
    console.warn('Stats increment failed (non-fatal):', err)
  })
}
```

#### 1-2. chat-messages/route.ts에 통계 호출 추가

| 위치 | 추가 내용 |
|------|----------|
| 사용자 메시지 저장 후 | `trackMessageStats(appId, 'user', isAnonymous)` |
| 어시스턴트 응답 저장 후 | `trackMessageStats(appId, 'assistant', isAnonymous, tokenCount)` |
| 새 세션 생성 시 | `trackSessionStats(appId, isAnonymous, true)` |

#### 1-3. 피드백 통계 추가

| 파일 | 위치 | 추가 내용 |
|------|------|----------|
| `app/api/apps/[appId]/chat-messages/route.ts` 또는 피드백 API | 피드백 저장 후 | like/dislike 카운트 증분 |

### 영향 분석

- **정상 채팅 흐름**: 영향 없음 (fire-and-forget, await 안 함)
- **통계 정확도**: 실시간에 가까운 정확도. 서버 재시작 시 손실 가능하나 `recalculateStats()`로 보정
- **DB 부하**: 메시지당 1회 upsert 추가 (경미한 수준)
- **기존 대시보드**: `getRealTimeStats()`는 그대로 유지 → 점진적으로 DailyUsageStats 기반으로 전환 가능

### 검증
- [ ] `pnpm build` 성공
- [ ] `trackMessageStats` 호출부가 await 없이 fire-and-forget인지 확인
- [ ] `incrementStats`의 try-catch가 내부적으로 처리되는지 확인
- [ ] 기존 채팅 메시지 전송 흐름에 블로킹 없는지 확인

### 복구 방법
```bash
git revert <Phase11-1 커밋해시>
```
통계 증분 호출만 제거됨. 채팅 기능, 기존 대시보드에 영향 없음.
수동 `recalculateStats()`는 그대로 유지.

---

## Phase 11-2: 에러 캡처 자동화

### 목표
모든 API catch 블록에 `errorCapture.captureApiError()` 추가하여,
에러 발생 시 `ErrorLog` 테이블에 자동 기록

### 현재 상태
- `errorCapture` 클래스가 존재하고 `captureApiError()` 메서드 제공
- **33개 API 라우트 중 0개에서 사용** (전부 `console.error`만)
- 유일한 사용처: `/api/errors/report` (클라이언트 에러 리포팅)

### 위험도: 낮음
- **수정 범위**: 20+ API 라우트 파일의 catch 블록
- **위험 요인**: `errorCapture` 자체가 실패해도 내부 try-catch로 안전
- **런타임 영향**: catch 블록에서만 실행 → 정상 요청에 영향 없음
- **DB 부하**: 에러 발생 시에만 INSERT → 평소에는 부하 없음

### 작업 내역

#### 2-1. 대상 API 라우트 (catch 블록에 errorCapture 추가)

**관리자 API (admin)**:

| 파일 | catch 위치 |
|------|-----------|
| `app/api/admin/apps/route.ts` | GET, POST catch |
| `app/api/admin/apps/[id]/route.ts` | GET, PUT, DELETE catch |
| `app/api/admin/admins/route.ts` | GET, POST catch |
| `app/api/admin/admins/[id]/route.ts` | GET, PUT, DELETE catch |
| `app/api/admin/admins/[id]/unlock/route.ts` | POST catch |
| `app/api/admin/auth/login/route.ts` | POST catch |
| `app/api/admin/auth/logout/route.ts` | POST catch |
| `app/api/admin/auth/me/route.ts` | GET catch |
| `app/api/admin/auth/change-password/route.ts` | POST catch |
| `app/api/admin/stats/overview/route.ts` | GET catch |
| `app/api/admin/stats/trend/route.ts` | GET catch |
| `app/api/admin/stats/recalculate/route.ts` | POST catch |
| `app/api/admin/errors/route.ts` | GET catch |
| `app/api/admin/errors/stats/route.ts` | GET catch |
| `app/api/admin/errors/[id]/route.ts` | GET, PATCH catch |
| `app/api/admin/audit-logs/route.ts` | GET catch |
| `app/api/admin/audit-logs/stats/route.ts` | GET catch |
| `app/api/admin/activity/route.ts` | GET catch |

**앱 API (apps)**:

| 파일 | catch 위치 |
|------|-----------|
| `app/api/apps/[appId]/chat-messages/route.ts` | POST 메인 catch |
| `app/api/apps/[appId]/conversations/route.ts` | GET catch |
| `app/api/apps/[appId]/messages/route.ts` | GET catch |
| `app/api/apps/[appId]/parameters/route.ts` | GET catch |
| `app/api/apps/[appId]/file-upload/route.ts` | POST catch |
| `app/api/apps/[appId]/info/route.ts` | GET catch |
| `app/api/apps/[appId]/sessions/route.ts` | GET, POST catch |
| `app/api/apps/[appId]/sessions/[sessionId]/route.ts` | PATCH, DELETE catch |
| `app/api/apps/public/route.ts` | GET catch |

**인증 API (auth)**:

| 파일 | catch 위치 |
|------|-----------|
| `app/api/auth/login/route.ts` | POST catch |
| `app/api/auth/token/route.ts` | POST catch |

**레거시 API (루트)**:

| 파일 | catch 위치 | 비고 |
|------|-----------|------|
| `app/api/file-upload/route.ts` | POST catch | 레거시 라우트 |
| `app/api/conversations/route.ts` | GET catch | 레거시 라우트 |

#### 2-2. 변경 패턴

```typescript
// Before
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('Operation failed:', error)
  return NextResponse.json({ error: message }, { status: 500 })
}

// After
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error('Operation failed:', error)
  errorCapture.captureApiError(error, request).catch(() => {})  // fire-and-forget
  return NextResponse.json({ error: message }, { status: 500 })
}
```

**핵심 원칙**:
- `await` 하지 않음 (응답 지연 방지)
- `.catch(() => {})` 추가 (unhandled rejection 방지)
- `console.error`는 유지 (기존 로깅과 병행)

#### 2-3. 제외 대상

| 파일 | 사유 |
|------|------|
| `app/api/errors/report/route.ts` | 이미 `captureClientError` 사용 중 |
| 레거시 API (`/api/chat-messages`, `/api/parameters` 등) | request 객체 접근이 다름 |

### 영향 분석

- **정상 요청**: 영향 없음 (catch 블록은 에러 시에만 실행)
- **에러 발생 시**: `ErrorLog` 테이블에 자동 기록 + 기존 `console.error` 유지
- **errorCapture 자체 실패 시**: 내부 try-catch + `.catch(() => {})` 이중 안전장치
- **DB 부하**: 에러 시에만 1회 INSERT (평소 0회)

### 검증
- [ ] `pnpm build` 성공
- [ ] `errorCapture.captureApiError()` 호출이 await 없이 fire-and-forget인지 확인
- [ ] import 문이 올바르게 추가되었는지 확인
- [ ] 기존 응답 포맷(JSON 구조, status 코드) 변경 없는지 확인

### 복구 방법
```bash
git revert <Phase11-2 커밋해시>
```
errorCapture 호출만 제거됨. 기존 console.error + 응답은 그대로 유지.

---

## 전체 작업 순서 및 체크리스트

### Step 1: Phase 11-1 (통계 자동 집계)
- [ ] `lib/stats-helper.ts` 생성 (fire-and-forget 헬퍼)
- [ ] `chat-messages/route.ts`에 통계 호출 추가
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: add automatic stats tracking on message send (Phase 11-1)`

### Step 2: Phase 11-2 (에러 캡처 자동화)
- [ ] 관리자 API catch 블록에 errorCapture 추가 (~18개 파일)
- [ ] 앱 API catch 블록에 errorCapture 추가 (~9개 파일)
- [ ] 인증 API catch 블록에 errorCapture 추가 (~2개 파일)
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: add automatic error capture to all API routes (Phase 11-2)`

### Step 3: 최종
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

### Phase 11-1 롤백 시
- 통계 증분 호출만 제거됨
- 기존 `getRealTimeStats()` (실시간 쿼리) 그대로 작동
- `recalculateStats()` (수동 재계산) 그대로 작동

### Phase 11-2 롤백 시
- errorCapture 호출만 제거됨
- 기존 `console.error` 로깅은 그대로 유지
- 에러 모니터링 페이지에 데이터가 안 쌓일 뿐, 기능 손실 없음
