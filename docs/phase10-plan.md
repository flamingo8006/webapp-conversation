# Phase 10: 에러 핸들링 강화 + 코드 품질 개선

**작성일**: 2026-02-07
**상태**: 계획 수립 완료, 작업 대기

---

## 개요

기존 커밋(`cdfb072`)에 영향을 주지 않도록 별도 커밋으로 분리하여,
에러 핸들링 강화 및 코드 품질을 개선한다.

---

## Git 전략

```
claude/review-progress-ughKp (cdfb072 - 기존 작업)
  ├── 커밋 A: Phase 10-1 Error Boundary
  ├── 커밋 B: Phase 10-3 any 타입 제거
  ├── 커밋 C: Phase 10-4 입력값 검증
  └── 커밋 D: Phase 10-5 Repository 에러 핸들링
```

- 각 Phase를 **개별 커밋**으로 분리
- 문제 발생 시 `git revert <커밋해시>`로 특정 작업만 롤백 가능
- Phase 10-2 (API 응답 포맷 통일)는 **추후 진행**

---

## Phase 10-1: Next.js Error Boundary 추가

### 목표
React 컴포넌트 에러 발생 시 백화면(White Screen) 대신 에러 안내 페이지 표시

### 위험도: 매우 낮음
- **기존 코드 수정**: 없음 (새 파일만 추가)
- **런타임 영향**: 에러 발생 시에만 실행됨
- **정상 동작 영향**: 없음

### 작업 내역

| 파일 (새로 생성) | 역할 |
|------------------|------|
| `app/global-error.tsx` | 최상위 에러 바운더리 (layout.tsx 포함 크래시) |
| `app/error.tsx` | 일반 페이지 에러 바운더리 |
| `app/not-found.tsx` | 404 Not Found 페이지 |
| `app/(admin)/admin/error.tsx` | 관리자 콘솔 에러 |
| `app/(portal)/error.tsx` | 포털 채팅 에러 |
| `app/simple-chat/[appId]/error.tsx` | 심플형 채팅 에러 |

### 구현 규칙
- `'use client'` 컴포넌트 (Next.js Error Boundary 필수)
- 에러 메시지 + "다시 시도" 버튼
- 다국어 지원 불필요 (에러 화면은 한/영 병기)
- Tailwind CSS 사용 (기존 스타일 일관성)

### 검증
- [ ] `pnpm build` 성공
- [ ] 각 error.tsx 파일이 올바른 위치에 존재하는지 확인
- [ ] 의도적 에러 throw 시 에러 페이지 표시되는지 확인 (로컬 테스트 시)

### 복구 방법
```bash
git revert <Phase10-1 커밋해시>
```
새 파일만 추가했으므로, revert하면 파일이 삭제되어 원래 상태로 복귀.

---

## Phase 10-2: API 응답 포맷 통일 (추후 진행)

### 목표
API 라우트의 에러 응답 포맷 통일 및 errorCapture 연동

### 위험도: 높음
- **기존 코드 수정**: 10+ API 라우트 파일
- **런타임 영향**: 응답 JSON 구조 변경 가능성
- **프론트엔드 영향**: `service/base.ts`의 응답 파싱 로직에 영향

### 보류 사유
1. 프론트엔드/백엔드 동시 수정 필요
2. 응답 구조 변경 시 기존 클라이언트 코드 파싱 오류 가능
3. 수동 브라우저 테스트 없이는 완전한 검증 불가

### 추후 진행 시 범위
- [ ] `lib/api-response.ts` 공통 헬퍼 생성
- [ ] `conversations/route.ts` catch 블록 status: 500 누락 수정
- [ ] 모든 API 라우트 catch 블록에 `errorCapture.captureApiError()` 추가
- [ ] 프론트엔드 응답 파싱 코드 호환성 확인

### 선행 조건
- 로컬 개발 환경에서 수동 테스트 가능한 상태
- E2E 테스트 작성 완료 (이상적)

---

## Phase 10-3: `any` 타입 제거 (TypeScript 강화)

### 목표
`any` 타입을 구체적 타입/인터페이스로 교체하여 타입 안전성 확보

### 위험도: 낮음
- **기존 코드 수정**: 15+ 파일
- **런타임 영향**: 없음 (TypeScript 타입은 컴파일 후 제거됨)
- **빌드 영향**: 타입 오류 시 빌드 실패 → `pnpm build`로 즉시 검증 가능

### 작업 내역

#### 3-1. Dify API 응답 타입 정의 (새 파일)

```
types/dify.ts (새로 생성)
```

| 인터페이스 | 용도 |
|-----------|------|
| `DifyConversation` | Dify 대화 목록 응답 항목 |
| `DifyConversationsResponse` | 대화 목록 API 전체 응답 |
| `DifyMessage` | Dify 메시지 항목 |
| `DifyMessageFile` | 메시지 첨부 파일 |
| `DifyMessagesResponse` | 메시지 목록 API 전체 응답 |
| `DifyStreamCallbackData` | SSE 스트림 콜백 파라미터 |

#### 3-2. `catch (error: any)` → `catch (error: unknown)` 변경

| 파일 | 라인 |
|------|------|
| `app/api/apps/[appId]/conversations/route.ts` | :93 |
| `app/api/apps/[appId]/messages/route.ts` | :82 |
| `app/api/apps/[appId]/parameters/route.ts` | :55 |
| `app/api/apps/[appId]/file-upload/route.ts` | :71 |
| `app/api/file-upload/route.ts` | :12 |
| `app/api/conversations/route.ts` | :13 |

변경 패턴:
```typescript
// Before
catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// After
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return NextResponse.json({ error: message }, { status: 500 })
}
```

#### 3-3. Dify API 응답 `any` → 타입 적용

| 파일 | 현재 | 변경 |
|------|------|------|
| `app/api/apps/[appId]/conversations/route.ts:59` | `const { data: difyData }: any` | `: DifyConversationsResponse` |
| `app/api/apps/[appId]/conversations/route.ts:75` | `.map((conv: any)` | `.map((conv: DifyConversation)` |
| `app/api/apps/[appId]/messages/route.ts:62` | `const { data }: any` | `: DifyMessagesResponse` |
| `app/api/apps/[appId]/messages/route.ts:67` | `(message: any)` | `(message: DifyMessage)` |
| `app/api/apps/[appId]/messages/route.ts:69` | `(file: any)` | `(file: DifyMessageFile)` |

#### 3-4. Repository `any` 제거

| 파일 | 현재 | 변경 |
|------|------|------|
| `lib/repositories/chatbot-app.ts:103` | `const updateData: any = {...data}; delete updateData.apiKey` | `const { apiKey, ...updateData } = data` 구조분해 |
| `lib/repositories/chat-session.ts:184` | `files?: any` | `files?: Record<string, unknown>` |

### 검증
- [ ] `pnpm build` 성공 (타입 오류 없음)
- [ ] 빌드 결과물 크기 변화 없음 확인 (타입은 런타임에 존재하지 않으므로)

### 복구 방법
```bash
git revert <Phase10-3 커밋해시>
```
타입 변경만이므로 revert해도 런타임 동작은 원래 상태와 동일.

---

## Phase 10-4: 입력값 검증 추가

### 목표
API 파라미터 유효성 검증을 추가하여, 잘못된 요청이 500 대신 400으로 응답

### 위험도: 낮음~중간
- **기존 코드 수정**: 5~8개 API 파일 (함수 앞부분에 검증 로직 추가)
- **런타임 영향**: 정상 요청은 기존과 동일. 비정상 요청만 400 반환 (기존: 500)
- **프론트엔드 영향**: `service/base.ts`에서 이미 status 기반 에러 처리하므로 호환됨

### 작업 내역

#### 4-1. 검증 헬퍼 함수 (새 파일)

```
lib/validation.ts (새로 생성)
```

| 함수 | 용도 |
|------|------|
| `isValidUUID(value)` | UUID 형식 검증 |
| `isValidDateString(value)` | 날짜 문자열 검증 (YYYY-MM-DD) |
| `isNonEmptyString(value)` | 빈 문자열 체크 |

#### 4-2. API 라우트에 검증 추가

| 파일 | 추가할 검증 | 현재 상태 |
|------|-----------|----------|
| `app/api/admin/stats/daily/route.ts` | `startDate`, `endDate` 날짜 형식 | 검증 없이 DB 조회 |
| `app/api/admin/stats/realtime/route.ts` | 날짜 파라미터 검증 | 동일 |
| `app/api/apps/[appId]/messages/route.ts` | `conversationId` 필수값 | 누락 시 Dify API에서 에러 |
| `app/api/apps/[appId]/sessions/[sessionId]/route.ts` | `sessionId` 형식 | 검증 없음 |

#### 4-3. 검증 규칙 (보수적 원칙)

```
- 필수 파라미터가 누락된 경우에만 400 반환
- 형식이 명확히 잘못된 경우에만 400 반환 (예: UUID가 아닌 문자열)
- 애매한 경우는 검증하지 않음 (기존 동작 유지)
- 빈 문자열 허용 여부는 기존 로직 따름
```

### 검증
- [ ] `pnpm build` 성공
- [ ] 기존 프론트엔드 코드에서 보내는 요청이 검증에 걸리지 않는지 확인
  - `service/index.ts`의 API 호출 파라미터와 검증 조건 대조
- [ ] 잘못된 파라미터 전송 시 400 응답 확인 (curl 테스트)

### 복구 방법
```bash
git revert <Phase10-4 커밋해시>
```
검증 로직 제거되어 기존처럼 500 에러로 처리됨. 기능 손실 없음.

---

## Phase 10-5: Repository 에러 핸들링 보강

### 목표
Repository 계층의 예외 상황에서 graceful 처리 (크래시 방지)

### 위험도: 낮음
- **기존 코드 수정**: 2~3개 파일
- **런타임 영향**: 정상 흐름에 영향 없음 (catch 블록 추가만)
- **프론트엔드 영향**: 없음

### 작업 내역

#### 5-1. decrypt 실패 시 graceful 처리

| 파일 | 함수 | 변경 |
|------|------|------|
| `lib/repositories/chatbot-app.ts` | `getChatbotAppWithKey()` | decrypt 실패 시 null 반환 + 에러 로깅 |

```typescript
// Before (decrypt 실패 시 전체 API 크래시)
apiKey: decrypt(app.apiKeyEncrypted)

// After (graceful 처리)
try {
  const apiKey = decrypt(app.apiKeyEncrypted)
  return { ...publicData, apiKey }
} catch (error) {
  console.error(`Failed to decrypt API key for app ${id}:`, error)
  return null
}
```

#### 5-2. TODO 코멘트 정리

| 파일 | 변경 |
|------|------|
| `app/components/base/file-uploader-in-attachment/hooks.ts:31` | `console.log('TODO')` → 빈 함수 + noop 주석 |

### 검증
- [ ] `pnpm build` 성공
- [ ] 정상 decrypt 동작 확인 (기존 테스트 데이터가 있다면)
- [ ] `getChatbotAppWithKey` 호출부에서 null 반환 시 처리가 되어있는지 확인

### 복구 방법
```bash
git revert <Phase10-5 커밋해시>
```
try-catch 제거되어 기존 동작(decrypt 실패 시 throw)으로 복귀. 정상 상황에서는 차이 없음.

---

## 전체 작업 순서 및 체크리스트

### Step 1: Phase 10-1 (Error Boundary)
- [ ] 파일 6개 생성
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: add Next.js error boundary pages for graceful error handling`

### Step 2: Phase 10-3 (any 타입 제거)
- [ ] `types/dify.ts` 생성
- [ ] API 라우트 `catch (error: any)` → `catch (error: unknown)` 변경
- [ ] Dify API 응답 `any` → 타입 적용
- [ ] Repository `any` 제거
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `refactor: replace any types with proper TypeScript interfaces`

### Step 3: Phase 10-4 (입력값 검증)
- [ ] `lib/validation.ts` 생성
- [ ] API 라우트에 검증 로직 추가
- [ ] `service/index.ts` 호출 파라미터와 검증 조건 대조 확인
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `feat: add input validation for API route parameters`

### Step 4: Phase 10-5 (Repository 보강)
- [ ] decrypt graceful 처리 추가
- [ ] TODO 코멘트 정리
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `fix: add graceful error handling in repository layer`

### Step 5: 최종 확인
- [ ] 전체 `pnpm build` 최종 확인
- [ ] git log로 커밋 이력 확인 (4개 커밋)
- [ ] 푸시: `git push -u origin claude/review-progress-ughKp`

---

## 비상 복구 절차

### 특정 Phase만 롤백
```bash
# 예: Phase 10-4 (입력값 검증)만 롤백
git revert <Phase10-4 커밋해시> --no-edit
git push -u origin claude/review-progress-ughKp
```

### 전체 Phase 10 롤백
```bash
# Phase 10 이전 상태로 복귀
git revert <Phase10-5>..<Phase10-1> --no-edit
# 또는
git reset --soft cdfb072
git commit -m "revert: rollback Phase 10 changes"
git push -u origin claude/review-progress-ughKp
```

### 롤백 후에도 기존 코드(cdfb072) 영향 없음 보장
- Phase 10-1: 새 파일만 추가 → 삭제하면 원상복귀
- Phase 10-3: 타입 변경만 → 런타임 동작 차이 없음
- Phase 10-4: if 검증 추가 → 제거하면 기존 동작
- Phase 10-5: try-catch 추가 → 제거하면 기존 throw 동작
