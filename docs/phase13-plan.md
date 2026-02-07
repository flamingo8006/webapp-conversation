# Phase 13: 보안 검토 및 취약점 수정

**작성일**: 2026-02-07
**상태**: 계획 수립 완료, 작업 대기

---

## 개요

OWASP Top 10 기반 코드 보안 검토를 수행하여 발견된 취약점을 수정합니다.
총 12개 취약점 발견, GitHub Cloud 환경에서 수정 가능한 항목을 Phase별로 분리합니다.

---

## 발견된 취약점 요약

| # | 취약점 | 심각도 | 수정 가능 | Phase |
|---|--------|--------|----------|-------|
| 1 | Embed 토큰 API 인증 없음 | Critical | ✅ | 13-1 |
| 2 | 보안 헤더 미설정 | Critical | ✅ | 13-2 |
| 3 | 비밀번호 변경 검증 불일치 (8자 vs 10자) | High | ✅ | 13-3 |
| 4 | 익명 세션 ID 형식 미검증 | High | ✅ | 13-3 |
| 5 | customTitle 길이 제한 없음 | Low | ✅ | 13-3 |
| 6 | CIDR /0 마스크 비트 시프트 오류 | Medium | ✅ | 13-3 |
| 7 | 에러 메시지에 내부 정보 노출 가능 | Medium | ✅ | 13-3 |
| 8 | IP 스푸핑 (X-Forwarded-For 신뢰) | High | ⚠️ | 추후 |
| 9 | CSRF 토큰 미적용 | Medium | ⚠️ | 추후 |
| 10 | 사용자 로그인 Rate Limiting 없음 | Medium | ⚠️ | 추후 |
| 11 | Embed 토큰 생성 감사 로그 없음 | Medium | ✅ | 13-1 |
| 12 | Dify 파일 URL 미검증 | Low | ⚠️ | 추후 |

**추후 진행 사유 (#8, #9, #10, #12)**:
- #8: 리버스 프록시 구성에 의존 (인프라 레벨 설정 필요)
- #9: Next.js에서 CSRF 토큰 구현이 복잡, SameSite 쿠키로 부분 완화됨
- #10: 레거시 인증 시스템에 의존, 별도 미들웨어 필요
- #12: Dify API 응답 구조 확인 필요 (외부 시스템)

---

## Git 전략

```
claude/review-progress-ughKp (현재)
  ├── 커밋 A: Phase 13-1 Embed 토큰 API 보안 강화
  ├── 커밋 B: Phase 13-2 보안 헤더 추가
  └── 커밋 C: Phase 13-3 입력값 검증 강화
```

---

## Phase 13-1: Embed 토큰 API 보안 강화

### 위험도: Critical → 수정 후 낮음

### 현재 문제
- `/api/auth/embed-token` 엔드포인트가 **인증 없이** JWT 토큰 발급
- 누구나 임의의 사용자 정보로 유효한 JWT를 생성 가능
- 감사 로그 미기록

### 수정 내용

**파일**: `app/api/auth/embed-token/route.ts`

1. **API Key 인증 활성화**: 주석 해제 + 환경변수 `EMBED_API_KEY` 검증
2. **미설정 시 비활성화**: `EMBED_API_KEY`가 없으면 엔드포인트 자체를 비활성화
3. **감사 로그 추가**: 토큰 생성 시 기록

```typescript
// After
export async function POST(request: NextRequest) {
  // EMBED_API_KEY가 설정되지 않으면 엔드포인트 비활성화
  const embedApiKey = process.env.EMBED_API_KEY
  if (!embedApiKey) {
    return NextResponse.json(
      { error: 'Embed token endpoint is not configured' },
      { status: 503 },
    )
  }

  // API Key 검증
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey || apiKey !== embedApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }

  // ... 기존 토큰 생성 로직
  // + 감사 로그 추가
}
```

### 검증
- [ ] `pnpm build` 성공
- [ ] `EMBED_API_KEY` 미설정 시 503 반환 확인
- [ ] 잘못된 API Key로 요청 시 401 반환 확인

### 복구
```bash
git revert <Phase13-1 커밋해시>
```

---

## Phase 13-2: 보안 헤더 추가

### 위험도: Critical → 수정 후 낮음

### 현재 문제
- `next.config.js`에 보안 헤더가 전혀 설정되지 않음
- XSS, 클릭재킹, MIME 타입 스니핑 등에 취약

### 수정 내용

**파일**: `next.config.js`

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}
```

**주의**:
- `X-Frame-Options: DENY`로 설정하되, **embed 페이지**(`/embed/*`)는 `SAMEORIGIN` 또는 제외 필요
- `Content-Security-Policy`는 프론트엔드 동적 스크립트와 충돌 가능하므로 추후 별도 추가
- `Strict-Transport-Security`는 HTTPS 환경에서만 적용 (현재 개발 환경은 HTTP)

### 검증
- [ ] `pnpm build` 성공
- [ ] embed 페이지가 iframe에서 정상 동작하는지 확인 필요 (데스크톱 테스트)

### 복구
```bash
git revert <Phase13-2 커밋해시>
```

---

## Phase 13-3: 입력값 검증 강화

### 위험도: High/Medium/Low → 수정 후 낮음

### 수정 내용 (5건)

#### 3-1. 비밀번호 변경 검증 일관성 (#3)

**파일**: `app/api/admin/auth/password/route.ts` (Line 31)

**현재**: `newPassword.length < 8` (8자) — 실제 정책은 10~20자
**수정**: 8자 체크를 제거하고 `adminRepository.updatePassword()`의 `validatePassword()` 정책에 위임

```typescript
// Before
if (newPassword.length < 8) {
  return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
}

// After (제거 - updatePassword 내부에서 10~20자 + 복잡도 검증)
```

#### 3-2. 익명 세션 ID UUID 형식 검증 (#4)

**파일**: `middleware.ts` (Line ~102)

**현재**: `x-session-id` 헤더 값을 형식 검증 없이 수락
**수정**: UUID 형식 검증 추가

```typescript
// sessionId가 있으면 UUID 형식인지 확인
if (sessionId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(sessionId)) {
    return new NextResponse('Invalid session ID', { status: 400 })
  }
  requestHeaders.set('x-is-anonymous', 'true')
  return nextWithRequestId(requestId, requestHeaders)
}
```

#### 3-3. customTitle 길이 제한 (#5)

**파일**: `app/api/apps/[appId]/sessions/[sessionId]/route.ts` (Line ~62)

**현재**: `customTitle`에 길이 제한 없음
**수정**: 200자 제한 추가

```typescript
case 'rename':
  if (typeof customTitle !== 'string') {
    return NextResponse.json({ error: 'customTitle is required' }, { status: 400 })
  }
  if (customTitle.length > 200) {
    return NextResponse.json({ error: 'customTitle is too long (max 200)' }, { status: 400 })
  }
  updatedSession = await updateSessionTitle(dbSessionId, customTitle)
  break
```

#### 3-4. CIDR /0 마스크 비트 시프트 수정 (#6)

**파일**: `lib/ip-utils.ts` (Line 44)

**현재**: `0xFFFFFFFF << (32 - mask)` — mask=0일 때 `<< 32`는 JavaScript에서 0을 반환해야 하지만 비트 연산 특성상 예측 불가
**수정**: mask=0 특수 처리

```typescript
// Before
const maskBits = 0xFFFFFFFF << (32 - mask)

// After
const maskBits = mask === 0 ? 0 : (0xFFFFFFFF << (32 - mask))
```

#### 3-5. catch 블록 에러 메시지 일반화 (#7)

**파일**: `app/api/apps/[appId]/file-upload/route.ts`

**현재**: 일부 catch 블록에서 `error.message`를 그대로 클라이언트에 반환
**수정**: 프로덕션에서는 일반적인 에러 메시지 반환

확인 필요 파일:
- `file-upload/route.ts` - 에러 메시지 직접 반환 여부 확인
- 기타 API 라우트 - 동일 패턴 확인

### 검증
- [ ] `pnpm build` 성공
- [ ] 기존 인증/세션 흐름에 영향 없는지 확인
- [ ] 비밀번호 변경 시 10자 미만 거부되는지 확인 (updatePassword 내부 검증)

### 복구
```bash
git revert <Phase13-3 커밋해시>
```

---

## 추후 진행 목록

### #8 IP 스푸핑 완화 (인프라 레벨)
- 리버스 프록시(Nginx/ALB) 설정에서 X-Forwarded-For 덮어쓰기
- 환경변수 `TRUSTED_PROXIES`로 신뢰할 프록시 IP 목록 지정
- 프록시 뒤가 아닌 환경에서는 X-Forwarded-For 무시

### #9 CSRF 보호
- SameSite=Strict 쿠키 설정 (현재 Lax)
- 또는 Origin/Referer 헤더 검증 미들웨어

### #10 사용자 로그인 Rate Limiting
- Redis 기반 또는 메모리 기반 Rate Limiter
- IP당 분당 요청 수 제한

### #12 Dify 파일 URL 검증
- Dify API 응답의 파일 URL 도메인 화이트리스트

---

## 전체 작업 순서 및 체크리스트

### Step 1: Phase 13-1 (Embed 토큰 API 보안)
- [ ] API Key 인증 활성화
- [ ] 미설정 시 엔드포인트 비활성화
- [ ] 감사 로그 추가
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `fix: secure embed token API with API key authentication (Phase 13-1)`

### Step 2: Phase 13-2 (보안 헤더)
- [ ] `next.config.js`에 보안 헤더 추가
- [ ] embed 경로 예외 처리
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `fix: add security headers to prevent XSS and clickjacking (Phase 13-2)`

### Step 3: Phase 13-3 (입력값 검증 강화)
- [ ] 비밀번호 검증 일관성 수정
- [ ] 세션 ID UUID 검증
- [ ] customTitle 길이 제한
- [ ] CIDR /0 마스크 수정
- [ ] 에러 메시지 일반화
- [ ] `pnpm build` 성공 확인
- [ ] 커밋: `fix: strengthen input validation and fix security issues (Phase 13-3)`

### Step 4: 최종
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

### Phase 13-1 롤백 시
- Embed 토큰 API가 다시 인증 없이 동작 (보안 위험 복원)
- 기존 시스템 동작에는 영향 없음

### Phase 13-2 롤백 시
- 보안 헤더 제거 → 이전 상태로 복원 (보안 위험 복원)
- 기존 기능에 영향 없음

### Phase 13-3 롤백 시
- 입력값 검증이 이전 수준으로 복원
- 비밀번호 검증이 8자 기준으로 복원 (보안 정책 불일치)
- 기존 기능에 영향 없음
