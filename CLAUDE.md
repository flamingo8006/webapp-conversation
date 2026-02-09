# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드입니다.

## 📂 참고 이미지 폴더

사용자가 참고용으로 올리는 이미지(스크린샷 등)는 아래 경로에 저장됩니다:
- **`D:\DEV\image`**

---

## 📋 프로젝트 개요

**DGIST Agentic AI 플랫폼 - Multi-App Webapp 포털**

Dify 플랫폼과 연동되는 Next.js 기반 대화형 웹 애플리케이션으로, 다음 기능을 제공합니다:
- **Multi-App 포털**: 여러 챗봇을 관리하고 선택하여 사용
- **익명 사용자 지원**: 공개 챗봇에 대한 익명 접근 허용
- **관리자 콘솔**: 챗봇 생성, 수정, 삭제, 공개 설정 관리
- **레거시 인증 연동**: 기존 인증 시스템과 JWT 기반 연동
- **임베드 지원**: 외부 시스템에 챗봇 삽입 가능

---

## ✅ 완료된 작업 목록

### Phase 1-3: 인프라 및 Multi-App 기반 ✅
- [x] Prisma 7 + PostgreSQL 15 설정
- [x] AES-256-GCM API Key 암호화 저장
- [x] JWT 인증 시스템 (RS256)
- [x] 레거시 인증 연동 (Mock 모드)
- [x] 관리자 CRUD API
- [x] 앱별 API 라우트
- [x] Repository 패턴 적용

### Phase 4: 포털 UI ✅
- [x] 챗봇 목록 포털 페이지
- [x] SimpleChatMain 컴포넌트 (세련된 심플형 UI)
- [x] 채팅 타입 선택 모달 (심플형/앱형)
- [x] 대화 이력 DB 저장

### Phase 5-6: 관리자 콘솔 및 기타 ✅
- [x] 관리자 레이아웃 (사이드바)
- [x] 챗봇 CRUD 기능
- [x] 게시하기 모달
- [x] 임베드 코드 모달
- [x] 한글 이름 Base64 인코딩
- [x] Prisma 7 pg adapter 설정

### Phase 7: 익명 사용자 지원 ✅
- [x] DB 스키마 업데이트 (공개 챗봇 설정)
- [x] Repository 업데이트 (공개 API)
- [x] 클라이언트 세션 관리 (localStorage)
- [x] Middleware 조건부 인증
- [x] API 라우트 하이브리드 처리 (인증/익명)
- [x] 관리자 UI 공개 설정 섹션
- [x] 공개 챗봇 목록 API

### Phase 8a: 채팅 기능 강화 ✅
- [x] 다국어 지원 (한글/영어 + OS 언어 감지)
  - 한글 번역 파일 생성 (`app.ko.ts`, `common.ko.ts`, `tools.ko.ts`)
  - i18n 설정에 한글 추가 및 localStorage 저장
  - 하드코딩된 문자열 → t() 함수 대체
  - 언어 선택 UI 컴포넌트 (헤더에 통합)
- [x] 답변 레퍼런스(출처) 표시
  - Citation UI 컴포넌트 생성
  - Answer 컴포넌트에 통합
  - retriever_resources 데이터 처리 활성화
- [x] 멀티모달 - 익명 사용자 파일 업로드 지원
  - file-upload 라우트에 익명 사용자 처리 추가
- [x] JWT 임베드 테스트 스크립트 생성
  - `scripts/generate-embed-token.ts`

### Phase 8a 보완: 다국어 기능 강화 ✅
- [x] 포털 메인 화면 다국어 지원
  - 번역 키 추가 (`portal.title`, `portal.subtitle`, 등)
  - 하드코딩된 한글 문자열 → t() 함수로 변경
  - 언어 선택 버튼 헤더에 추가
  - 브라우저 탭 제목(title) 다국어 지원
- [x] 챗봇 이름/설명 다국어 지원
  - DB 스키마에 nameKo, nameEn, descriptionKo, descriptionEn 필드 추가
  - Repository/API에 다국어 필드 처리 추가
  - 관리자 콘솔에서 한글/영어 입력 UI 추가 (병렬 배치)
  - 포털 화면에서 현재 언어에 맞는 이름/설명 표시
  - 기존 데이터 마이그레이션 (name → nameKo, description → descriptionKo)

### Phase 8b: 관리 인프라 ✅
- [x] 관리자(Admin) 분리 인증 시스템
  - Admin 테이블 및 Repository 생성
  - 별도 JWT (admin_token) 발급/검증
  - 관리자 로그인 페이지 (`/admin/login`)
  - bcrypt 비밀번호 해싱
- [x] 관리자 관리 UI (슈퍼관리자 전용)
  - 관리자 목록/추가/수정/삭제
  - 비밀번호 초기화 기능
  - 역할 관리 (super_admin, admin)
- [x] 감사 로그 (AuditLog)
  - 모든 관리자 액션 기록
  - 필터/검색/페이지네이션
  - 상세 보기 다이얼로그
- [x] 사용 통계 대시보드 (DailyUsageStats)
  - 실시간 통계 (오늘 세션/메시지)
  - 기간별 트렌드 차트 (recharts)
  - 챗봇별 사용 순위
  - 피드백 통계 (좋아요/싫어요)
- [x] 에러 모니터링 (ErrorLog)
  - 에러 목록/필터/검색
  - 상태 관리 (new → investigating → resolved/ignored)
  - 상세 보기 (스택 트레이스)
- [x] 시드 스크립트 (`prisma/seed.ts`)
  - 슈퍼관리자 계정 자동 생성
- [x] Select 컴포넌트 추가 (shadcn/ui)
- [x] i18n locale 에러 수정

### Phase 8b 보완: 대시보드 개선 ✅
- [x] 주간 요약 개선
  - 활성/비활성 챗봇 숫자 → 챗봇별 주간 메시지/토큰 수 (Top 5)
  - `getAppRanking`에 `totalTokens` 필드 추가
- [x] 활동 내역 페이지 (`/admin/activity`)
  - 메시지 내역 테이블 (시간, 챗봇, 사용자, 역할, 내용)
  - 챗봇별 필터링 (드롭다운)
  - 기간별 필터링 (오늘, 최근 7일, 14일, 30일, 90일)
  - 사용자 이름 검색
  - 페이지네이션
- [x] 최근 활동 "더 보기" 버튼
  - 대시보드에서 활동 내역 페이지로 이동
- [x] 사이드바에 "활동 내역" 메뉴 추가
- [x] Q&A 펼침 기능 (활동 내역)
  - 사용자 질문 행 클릭 시 Q&A 쌍 펼침/접힘
  - 세션 기반 Q&A 매칭 (5분 이내 답변)
  - 여러 행 동시 펼침 가능
  - API에 전체 content 반환 (contentPreview로 미리보기 분리)

### Phase 9a: 포털 인증 정리 ✅
- [x] /login 페이지 변경 (Mock 계정 제거 → 안내 페이지)
- [x] Mock 계정 제거 (legacy-auth.ts)
- [x] 토큰 기반 포털 접근 구현 (/api/auth/token)
- [x] localStorage → sessionStorage 변경 (익명 세션)
  - 탭/브라우저 닫으면 세션 삭제 (공용 PC 문제 해결)
- [x] 포털 챗봇 카드 UI 변경
  - 익명 사용자: 바로 심플형으로 이동
  - 인증 사용자: 카드 내 심플형/앱형 선택
- [x] 익명 사용자 앱형 사용 불가 (심플형만 허용)
- [x] 로그아웃 후 / 로 이동 (/login 아님)

### Phase 9b: 관리자 보안 강화 ✅
- [x] 로그인 시도 제한
  - Admin 테이블에 `loginAttempts`, `lockedUntil` 필드 추가
  - 환경변수 `ADMIN_MAX_LOGIN_ATTEMPTS` (기본값: 5, 0=무제한)
  - 환경변수 `ADMIN_LOCKOUT_MINUTES` (기본값: 30분)
  - 횟수 초과 시 계정 잠금
  - 잠금 해제 API 및 UI (슈퍼관리자 전용)
- [x] 비밀번호 정책
  - 길이: 10~20자
  - 필수 포함: 영대문자 + 영소문자 + 숫자 + 특수문자
  - 제외 문자: <, >, ', "
  - 직전 비밀번호 재사용 불가 (`previousPasswordHash` 필드)
  - 비밀번호 변경/초기화 시 정책 검증
- [x] IP 화이트리스트
  - 환경변수 `ADMIN_ALLOWED_IPS` (쉼표로 구분)
  - CIDR 표기법 지원 (예: 192.168.1.0/24)
  - middleware + 로그인 API에서 체크
  - 미설정 시 모든 IP 허용

### Phase 8c: 앱형 UI 변경 (ChatGPT 스타일) ✅
- [x] WelcomeScreen 컴포넌트 (`app/components/welcome-screen/index.tsx`)
  - 중앙 환영 메시지 + 챗봇 아이콘
  - 중앙 입력창 (바로 새 채팅 시작)
  - 파일 업로드 지원 (이미지, 문서)
- [x] ExampleQuestions 컴포넌트 (`app/components/example-questions/index.tsx`)
  - 2x2 카드 그리드 레이아웃
  - 클릭 시 해당 질문으로 새 채팅 시작
  - 다국어 지원 (한/영)
- [x] Sidebar 개선 (`app/components/sidebar/index.tsx`)
  - 날짜별 그룹핑 (오늘, 어제, 지난주, 지난달, 이전)
  - 대화 검색 기능
  - 호버 시 삭제 버튼 표시
  - shadcn/ui 컴포넌트 적용
- [x] Header 개선 (`app/components/header.tsx`)
  - 언어 선택 드롭다운 통합
  - 툴팁 추가
- [x] Chat 개선 (`app/components/chat/index.tsx`)
  - Sticky bottom 입력창
  - 자동 크기 조절 textarea
  - 그라디언트 페이드 효과
- [x] Main 컴포넌트 리뉴얼 (`app/components/index.tsx`)
  - 초기 화면 (WelcomeScreen) / 대화 화면 (Chat) 분기
  - 환영 화면에서 메시지 전송 처리
- [x] 반응형 디자인
  - 모바일 (< 768px): 사이드바 토글
  - 태블릿 (768px ~ 1024px): 사이드바 축소
  - 데스크톱 (> 1024px): 사이드바 항상 표시
- [x] 다국어 번역 키 추가 (`i18n/lang/app.ko.ts`, `app.en.ts`)
  - `welcome` 섹션: title, subtitle, inputPlaceholder, examplesTitle, example1-4
  - `sidebar` 섹션: newChat, search, today, yesterday, lastWeek, lastMonth, older 등

### Phase 8c-2: 앱형/심플형 채팅 UI 개선 ✅
- [x] 예시 질문 카드 조건부 표시
  - Dify에서 `suggested_questions` 없으면 예시 섹션 숨김
  - defaultExamples 폴백 로직 제거
- [x] 대화 제목 실시간 업데이트
  - 새 대화 시작 시 첫 메시지 앞 30자를 임시 제목으로 설정
- [x] 대화 목록 기능 추가 (고정/이름변경/삭제)
  - DB 스키마: `customTitle`, `isPinned`, `pinnedAt` 필드 추가
  - API: `PATCH/DELETE /api/apps/[appId]/sessions/[sessionId]`
  - Sidebar: 드롭다운 메뉴, 고정 그룹 상단 표시
  - 이름 변경 다이얼로그
- [x] 스크롤 동작 개선
  - WelcomeScreen min-h 제거 → h-full
  - 페이지 레벨 스크롤 방지 (overflow-hidden)
- [x] 심플형 Suggested Questions 표시
  - SimpleChat에 suggestedQuestions props 추가
  - 초기 화면에 2x2 그리드 예시 질문 카드 표시

### Phase 8c-3: 디자인 개선 + 버그 수정 ✅
- [x] 앱형 레이아웃: [사이드바 | 헤더+채팅] 구조
- [x] 사이드바 접힘 시 대화내역 숨김 (아이콘만 표시)
- [x] 채팅 입력창 하단 고정 (flex column 레이아웃)
- [x] 대화 제목 15자 초과 시 `...` 처리 + 호버 시 전체 제목 tooltip
- [x] 채팅 영역 max-w-3xl 중앙 배치
- [x] 고정된 대화 앞에 핀 아이콘 표시 (고정됨 그룹 레이블 숨김)
- [x] 심플형/앱형 면책 문구 추가
- [x] SSE 파서 버퍼 기반으로 변경 (청크 경계 버그 수정)
- [x] Dify + DB 세션 머지 (conversations API)
- [x] 삭제된 대화 Dify 목록에서 필터링
- [x] Middleware: 원본 request headers 보존 (Cookie 유실 방지)
- [x] Middleware: JWT 토큰 우선 확인 (X-Session-Id보다 먼저)
- [x] 대화 삭제 후 WelcomeScreen 전환 (`setCurrConversationId('-1')`)
- [x] 사용자 브라우저 테스트 완료 (2026-02-07)

### Phase 10: 에러 핸들링 강화 + 코드 품질 개선 ✅
- [x] Phase 10-1: Next.js Error Boundary 추가 (새 파일 6개)
- [x] Phase 10-2: API 응답 포맷 통일
  - 공통 API 응답 헬퍼 생성 (`lib/api-response.ts`)
  - file-upload: 에러 시 status 200 → 500 수정 (파일 ID 오염 버그 수정)
  - chat-messages, messages, feedbacks: try-catch + logger + errorCapture 추가
  - conversations: 에러 시 status 500 추가 + logger
  - parameters: 의도적 폴백에 logger.apiWarn 추가
  - 성공 응답 구조는 변경 없음 (프론트엔드 호환성 유지)
- [x] Phase 10-3: `any` 타입 제거 (TypeScript 강화, `types/dify.ts` 생성)
- [x] Phase 10-4: 입력값 검증 추가 (`lib/validation.ts` 생성)
- [x] Phase 10-5: Repository 에러 핸들링 보강

### Phase 11: 통계 자동 집계 + 에러 캡처 자동화 ✅
- [x] Phase 11-1: 통계 데이터 자동 집계
  - `lib/stats-helper.ts` 생성 (fire-and-forget 패턴)
  - `chat-messages/route.ts`에 `trackMessageStats()` 호출 추가
- [x] Phase 11-2: 에러 캡처 자동화
  - 31개 API 라우트 파일, 41개 catch 블록에 `errorCapture.captureApiError()` 추가
  - fire-and-forget 패턴 (await 없이, `.catch(() => {})` 안전장치)

### Phase 12: 구조화된 로깅 시스템 ✅
- [x] Phase 12-1: 로거 모듈 생성 (`lib/logger.ts`)
  - 로그 레벨 (debug/info/warn/error), 개발/프로덕션 이중 포맷
  - API 헬퍼 메서드 (`apiError`, `apiWarn` 등) - request 컨텍스트 자동 추출
- [x] Phase 12-2: API 라우트에 로거 적용
  - 34개 API 라우트 파일, 46개 `console.error/warn` → `logger.apiError/apiWarn` 교체
- [x] Phase 12-3: 라이브러리에 로거 적용
  - 7개 lib 파일, 11개 `console.error/warn` → `logger.error/warn` 교체
- [x] Phase 12-4: 미들웨어에 Request ID 추가
  - 모든 요청에 `x-request-id` UUID 부여, 요청 추적 가능

### Phase 14: 관리자 그룹 관리 ✅
- [x] DB 스키마: `AdminGroup`, `AdminGroupMember` 테이블 추가
- [x] Repository: `lib/repositories/admin-group.ts` 생성
- [x] API: 그룹 CRUD + 멤버 관리 (`/api/admin/groups/`)
- [x] UI: 그룹 목록/생성/수정 페이지
- [x] 권한: 그룹 기반 앱 가시성 필터링 (통계/대시보드)

### 관리자 역할별 접근 제어 ✅
- [x] 대시보드: super_admin → "최근 활동", admin → "오늘의 상세 현황"
- [x] 사용 통계: super_admin → "최근 메시지", admin → "사용자 유형 분석"
- [x] 사이드바: 활동 내역/감사 로그/에러 모니터링 → super_admin 전용
- [x] API 보안: recentMessages 조건부 반환 (admin role 체크)

### 관리자 경로 보안 ✅
- [x] `NEXT_PUBLIC_ADMIN_BASE_PATH` 환경변수로 관리자 URL 변경
- [x] `lib/admin-path.ts` 헬퍼 (22개 파일 참조 교체)
- [x] middleware: 커스텀 경로 → /admin rewrite, 기본 /admin 차단
- [x] 기본값 'admin', 커스텀 예: 'dgai-mgmt' → `/dgai-mgmt/login`

### 채팅 UI 개선 (2026-02-09) ✅
- [x] 피드백 401 에러 수정 (앱별 feedbacks API 라우트 생성)
- [x] 좋아요/싫어요 UI: solid 아이콘 (파란/빨간), 한글/영어 번역
- [x] 답변 복사 버튼 추가 (클립보드 복사 + 체크 아이콘 피드백)
- [x] 입력창 자동 확장 (최대 8줄, 이후 스크롤)

### 통계 집계 버그 수정 (2026-02-09) ✅
- [x] 타임존 버그: `setHours(0,0,0,0)` → `toUTCDate()` 변환 (5곳)
- [x] `trackSessionStats` / `trackFeedbackStats` 호출 추가
- [x] 프론트엔드 날짜 매칭: `toISOString()` → 로컬 날짜 문자열

---

## 🔄 현재 상태

**상태**: Phase 1~14 + Phase 10-2 + 관리자 접근 제어 + 경로 보안 + 채팅 개선 모두 완료

**상세 계획서**:
- [`docs/phase10-plan.md`](docs/phase10-plan.md) - 에러 핸들링 강화
- [`docs/phase11-plan.md`](docs/phase11-plan.md) - 통계 자동 집계 + 에러 캡처
- [`docs/phase12-plan.md`](docs/phase12-plan.md) - 구조화된 로깅 시스템
- [`docs/phase13-plan.md`](docs/phase13-plan.md) - 보안 검토 (배포 전 진행)

**주요 커밋 이력**:
- `8375160` 레거시 API 에러 응답 포맷 통일 (Phase 10-2)
- `09b9d03` 관리자 접근 제어, 피드백 개선, 경로 보안, 통계 버그 수정, Phase 14
- `73c6c0d` Middleware 헤더 보존 + 세션 관리 버그 수정
- `a701ef0` Phase 10~14 원격 브랜치 머지
- `cdfb072` Phase 8b/8c/9a/9b 완료

**알려진 버그**:
- Windows에서 Next.js standalone 빌드 시 symlink 권한 오류 (개발 모드는 정상 동작)

---

## ✅ Phase 8c UI 변경 테스트 결과 (2026-02-05)

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| 1. 환영 화면 표시 | ✅ 통과 | 대화 미선택 시 WelcomeScreen 표시 |
| 2. 예시 질문 클릭 | ✅ 통과 | 클릭 시 새 채팅 시작 |
| 3. 날짜별 그룹핑 | ✅ 통과 | 오늘, 어제, 지난주 등 그룹 표시 |
| 4. 대화 검색 | ✅ 통과 | 제목 기준 필터링 |
| 5. 삭제 버튼 | ✅ 통과 | 호버 시 표시 |
| 6. 언어 전환 | ✅ 통과 | 환영 메시지, 예시 질문 한/영 전환 |
| 7. 입력창 자동 크기 | ✅ 통과 | 텍스트 양에 따라 높이 조절 |
| 8. 반응형 (모바일) | ✅ 통과 | 사이드바 토글 정상 |
| 9. 파일 업로드 | ✅ 통과 | 환영 화면에서 파일 첨부 가능 |
| 10. 채팅 화면 전환 | ✅ 통과 | 대화 선택 시 Chat 컴포넌트 표시 |

---

## ✅ Phase 8b 관리 인프라 테스트 결과 (2026-02-03)

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| 1. 관리자 로그인 페이지 | ✅ 통과 | `/admin/login` |
| 2. 관리자 로그인 API | ✅ 통과 | JWT 발급, 쿠키 설정 |
| 3. 관리자 대시보드 | ✅ 통과 | `/admin` |
| 4. 관리자 관리 페이지 | ✅ 통과 | 목록, 추가, 수정, 비밀번호 초기화 |
| 5. 사용 통계 페이지 | ✅ 통과 | 실시간 통계, 차트 |
| 6. 감사 로그 페이지 | ✅ 통과 | 필터, 페이지네이션, 상세 보기 |
| 7. 에러 모니터링 페이지 | ✅ 통과 | 상태 관리, 상세 보기 |
| 8. 관리자 프로필 페이지 | ✅ 통과 | `/admin/profile` |
| 9. 감사 로그 기록 | ✅ 통과 | 로그인 시 자동 기록 |
| 10. 포털 페이지 | ✅ 통과 | 기존 기능 정상 동작 |

**관리자 계정 정보**:
- Login ID: `superadmin`
- Password: `ChangeMe123!` (Phase 9b 정책 준수)
- 역할: `super_admin`

---

## ✅ Phase 8a 다국어 테스트 결과 (2026-02-03)

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| 1. 포털 제목/부제목 다국어 | ✅ 통과 | 한/영 전환 시 텍스트 변경 확인 |
| 2. 버튼 텍스트 다국어 | ✅ 통과 | 관리자, 로그아웃, 로그인, 채팅 시작 |
| 3. 브라우저 탭 제목 | ✅ 통과 | 언어 전환 시 title 변경 |
| 4. 관리자 폼 다국어 UI | ✅ 통과 | 한글/영어 이름, 설명 필드 병렬 배치 |
| 5. 챗봇 생성/수정 | ✅ 통과 | 다국어 필드 입력 및 저장 |
| 6. 포털 챗봇 이름 (한국어) | ✅ 통과 | nameKo 표시 |
| 7. 포털 챗봇 이름 (영어) | ✅ 통과 | nameEn 표시 (없으면 nameKo 폴백) |
| 8. 심플형 채팅 앱 이름 | ✅ 통과 | 언어 전환 시 동적 변경 |
| 9. 심플형 채팅 플레이스홀더 | ✅ 통과 | 한/영 전환 확인 |
| 10. 심플형 채팅 환영 메시지 | ✅ 통과 | 한/영 전환 확인 |

---

## ✅ Phase 7 테스트 결과 (2026-02-02)

| 테스트 항목 | 결과 | 비고 |
|------------|------|------|
| 1. 익명 사용자 전체 플로우 | ✅ 통과 | sessionId 생성, 메시지 전송, 세션 복원 |
| 2. 메시지 제한 기능 | ✅ 통과 | 429 에러 채팅창 표시 |
| 3. 관리자 콘솔 CRUD | ✅ 통과 | 생성, 수정, 삭제, 공개 설정 |
| 4. 권한 검증 | ✅ 통과 | 비인증/일반사용자 차단, 비공개 챗봇 차단 |
| 5. 게시 및 임베드 (공개형) | ✅ 통과 | 화면배치형, 플로팅형 |

---

## 📌 다음에 해야 할 작업 (우선순위)

### 완료: Phase 10 - 에러 핸들링 강화 + 코드 품질 개선 ✅
- [x] 작업 계획 수립 → [`docs/phase10-plan.md`](docs/phase10-plan.md)
- [x] Phase 10-1: Next.js Error Boundary 추가
- [x] Phase 10-2: API 응답 포맷 통일 → `8375160`
- [x] Phase 10-3: `any` 타입 제거 (TypeScript 강화)
- [x] Phase 10-4: 입력값 검증 추가
- [x] Phase 10-5: Repository 에러 핸들링 보강

### 완료: Phase 11 - 통계 자동 집계 + 에러 캡처 자동화 ✅
- [x] 작업 계획 수립 → [`docs/phase11-plan.md`](docs/phase11-plan.md)
- [x] Phase 11-1: 통계 데이터 자동 집계 (메시지 전송 시 DailyUsageStats 증분) → `0ac4ea2`
- [x] Phase 11-2: 에러 캡처 자동화 (31개 API 파일, 41개 catch 블록) → `3b4ca58`

### 완료: Phase 12 - 구조화된 로깅 시스템 ✅
- [x] 작업 계획 수립 → [`docs/phase12-plan.md`](docs/phase12-plan.md)
- [x] Phase 12-1: 로거 모듈 생성 → `e292941`
- [x] Phase 12-2: API 라우트에 로거 적용 (34개 파일) → `1eb065c`
- [x] Phase 12-3: 라이브러리에 로거 적용 (7개 파일) → `c3b5b70`
- [x] Phase 12-4: 미들웨어에 Request ID 추가 → `30100f3`

### 우선순위 1: 프로덕션 배포 전 (기능 개발 완료 후 진행)
- [ ] Phase 13: 보안 검토 및 취약점 수정 → [`docs/phase13-plan.md`](docs/phase13-plan.md)
  - Embed 토큰 API 인증 (Critical)
  - 보안 헤더 추가 (Critical)
  - 입력값 검증 강화 5건 (High~Low)
  - IP 스푸핑 완화, CSRF, Rate Limiting, Dify URL 검증 (추후)
- [ ] E2E 테스트 작성 (Playwright)
- [ ] 성능 최적화 (DB 쿼리, 번들 사이즈)
- [x] 에러 핸들링 강화 → Phase 10 완료 (10-2 포함)
- [x] 로깅 시스템 → Phase 12 완료

### 우선순위 3: 레거시 인증 연동 후 테스트
- [ ] **인증형 임베드 테스트** - `npx ts-node scripts/generate-embed-token.ts` 사용
- [ ] 레거시 인증 시스템 연동 테스트

---

## 🛠 기술 스택

### 핵심 프레임워크
- **Next.js 15.5** - React 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성

### 데이터베이스 & ORM
- **PostgreSQL 15** - 관계형 데이터베이스
- **Prisma 7** - ORM (pg adapter 사용)

### 인증 & 보안
- **jose** - JWT 생성/검증 (RS256)
- **crypto** - API Key 암호화 (AES-256-GCM)

### UI & 스타일링
- **Tailwind CSS 4** - 유틸리티 CSS
- **Radix UI** - 접근성 높은 컴포넌트
- **Lucide React** - 아이콘

### API & 통신
- **Dify Client** - Dify 플랫폼 연동
- **SSE (Server-Sent Events)** - 스트리밍 응답

### 개발 도구
- **ESLint** (@antfu/eslint-config)
- **Docker** - 개발 환경 (PostgreSQL)

---

## 📁 주요 파일 구조

```
webapp-conversation/
├── app/
│   ├── (admin)/admin/          # 관리자 콘솔
│   │   ├── apps/               # 챗봇 관리
│   │   ├── admins/             # 관리자 관리
│   │   ├── groups/             # 그룹 관리 (Phase 14)
│   │   ├── stats/              # 사용 통계
│   │   ├── activity/           # 활동 내역
│   │   └── layout.tsx          # 관리자 레이아웃 (사이드바)
│   ├── (auth)/login/           # 로그인 페이지
│   ├── (portal)/chat/[appId]/  # 포털 채팅 페이지
│   ├── simple-chat/[appId]/    # 심플형 채팅 페이지
│   │
│   ├── api/
│   │   ├── auth/               # 인증 API
│   │   ├── admin/              # 관리자 API (인증 필수)
│   │   │   ├── apps/           # 챗봇 관리
│   │   │   ├── admins/         # 관리자 관리
│   │   │   ├── groups/         # 그룹 관리 (Phase 14)
│   │   │   ├── stats/          # 사용 통계
│   │   │   └── activity/       # 활동 내역
│   │   └── apps/
│   │       ├── public/         # 공개 챗봇 목록 (익명 접근 가능)
│   │       └── [appId]/
│   │           ├── info/       # 챗봇 정보 (익명 접근 가능)
│   │           ├── chat-messages/  # 메시지 전송 (하이브리드)
│   │           ├── conversations/  # 대화 목록 (하이브리드)
│   │           └── messages/       # 메시지 조회 (하이브리드)
│   │
│   └── components/
│       ├── admin/              # 관리자 컴포넌트
│       ├── portal/             # 포털 컴포넌트
│       ├── providers/          # Context Providers
│       ├── welcome-screen/     # 환영 화면 컴포넌트 (Phase 8c)
│       ├── example-questions/  # 예시 질문 컴포넌트 (Phase 8c)
│       ├── sidebar/            # 사이드바 컴포넌트 (Phase 8c 개선)
│       ├── chat/               # 채팅 컴포넌트 (Phase 8c 개선)
│       ├── simple-chat-main.tsx  # 심플형 채팅 UI
│       └── simple-chat.tsx     # 채팅 컴포넌트
│
├── lib/
│   ├── prisma.ts               # Prisma 클라이언트
│   ├── jwt.ts                  # JWT 유틸리티
│   ├── encryption.ts           # API Key 암호화
│   ├── session-manager.ts      # 클라이언트 세션 관리
│   ├── auth-utils.ts           # 인증 유틸리티
│   ├── legacy-auth.ts          # 레거시 인증 연동
│   ├── admin-path.ts           # 관리자 URL 경로 헬퍼
│   ├── admin-auth.ts           # 관리자 인증 유틸리티
│   ├── logger.ts               # 구조화된 로거
│   ├── stats-helper.ts         # 통계 자동 집계 헬퍼
│   ├── api-response.ts          # 공통 API 응답 헬퍼
│   ├── validation.ts           # 입력값 검증
│   └── repositories/
│       ├── chatbot-app.ts      # 챗봇 앱 Repository
│       ├── chat-session.ts     # 채팅 세션 Repository
│       ├── admin.ts            # 관리자 Repository
│       ├── admin-group.ts      # 관리자 그룹 Repository
│       └── usage-stats.ts      # 사용 통계 Repository
│
├── prisma/
│   ├── schema.prisma           # DB 스키마
│   └── migrations/             # 마이그레이션
│
├── middleware.ts               # Next.js 미들웨어 (인증 체크)
├── service/                    # API 서비스 계층
├── hooks/                      # React Hooks
└── types/                      # TypeScript 타입 정의
```

---

## ⚙️ 환경 변수 (.env.local)

### 필수 환경 변수

```bash
# 데이터베이스
DATABASE_URL=postgresql://chatbot:chatbot123@localhost:5432/chatbot

# JWT (RS256) - 레거시 인증
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_ISSUER=dgist-auth
JWT_AUDIENCE=dgist-chatbot

# API Key 암호화 (AES-256-GCM)
# 생성: openssl rand -base64 32
ENCRYPTION_KEY=your-32-byte-base64-encoded-key

# 인증 모드 (Phase 9a: mock 모드 제거됨)
AUTH_MODE=legacy
LEGACY_AUTH_API_URL=https://portal.dgist.ac.kr/api/auth/login

# 레거시 (하위 호환용, Phase 7 이후 제거 가능)
NEXT_PUBLIC_APP_ID=your-dify-app-id
NEXT_PUBLIC_APP_KEY=your-dify-api-key
NEXT_PUBLIC_API_URL=https://api.dify.ai/v1

# 관리자 보안 설정 (Phase 9b)
ADMIN_MAX_LOGIN_ATTEMPTS=5       # 최대 로그인 시도 횟수 (0=무제한)
ADMIN_LOCKOUT_MINUTES=30         # 잠금 시간 (분)
ADMIN_ALLOWED_IPS=               # IP 화이트리스트 (쉼표 구분, 빈값=모든 IP 허용)
                                 # 예: 192.168.1.0/24,10.0.0.5,203.0.113.0/24

# 관리자 경로 보안
NEXT_PUBLIC_ADMIN_BASE_PATH=dgai-mgmt  # 관리자 URL 경로 (기본값: admin)
                                        # 예: dgai-mgmt → /dgai-mgmt/login
                                        # 설정 시 /admin 직접 접근 차단 (404)
```

### JWT 키 생성 방법

```bash
# 스크립트 실행
npm run generate-keys

# 또는 수동 생성
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### 암호화 키 생성 방법

```bash
openssl rand -base64 32
```

---

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 설정

```bash
# Docker로 PostgreSQL 실행
docker-compose -f docker-compose.dev.yml up -d

# Prisma 마이그레이션
npx prisma migrate dev --url "postgresql://chatbot:chatbot123@localhost:5432/chatbot"

# Prisma Client 생성
npx prisma generate
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
npm run start
```

---

## 🔐 인증 구조

### 레거시 인증 방식
- **User 테이블 없음**: 사용자 정보는 DB에 저장하지 않음
- **외부 인증 시스템**: Mock 또는 레거시 API로 사용자 인증
- **JWT Payload**: empNo, loginId, name, role 포함
- **JWT 만료**: 1시간

### 익명 사용자 방식
- **sessionId**: sessionStorage에 UUID 저장 (Phase 9a 변경)
- **자동 생성**: 최초 공개 챗봇 접속 시
- **세션 복원**: 탭 유지 중에만 복원 (탭/브라우저 닫으면 새 세션)
- **심플형만 허용**: 익명 사용자는 앱형 사용 불가

### Middleware 경로 규칙

| 경로 | 인증 요구 | 비고 |
|------|----------|------|
| `/login`, `/api/auth/*` | 불필요 | 공개 |
| `/simple-chat/[appId]` | 조건부 | 챗봇 설정에 따라 결정 |
| `/`, `/api/apps/public`, `/api/apps/[appId]/info` | 불필요 | 공개 API |
| `/chat/[appId]` | 쿠키 | 인증 필수 |
| `/${ADMIN_BASE_PATH}/*` | 쿠키 + admin_token | 관리자 전용 (커스텀 경로) |
| `/admin/*` | 차단 (404) | 커스텀 경로 설정 시 직접 접근 차단 |
| `/api/admin/*` | admin_token | 관리자 API (경로 변경 없음) |
| `/api/apps/[appId]/*` | 조건부 | 챗봇 설정 + 헤더 검사 |

---

## 📊 데이터베이스 스키마

### ChatbotApp (챗봇 앱)
- `id`, `name`, `description`
- `nameKo`, `nameEn`, `descriptionKo`, `descriptionEn` (Phase 8a - 다국어)
- `difyAppId`, `apiKeyEncrypted`, `apiUrl`
- `isPublic`, `requireAuth`, `allowAnonymous`, `maxAnonymousMsgs` (Phase 7)
- `isActive`, `sortOrder`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

### ChatSession (채팅 세션)
- `id`
- `isAnonymous`, `sessionId` (Phase 7 - 익명 사용자)
- `userId`, `userLoginId`, `userName` (인증 사용자)
- `appId`, `difyConversationId`, `title`
- `customTitle`, `isPinned`, `pinnedAt` (Phase 8c-2 - 대화 관리)
- `isActive`, `lastMessageAt`, `createdAt`, `updatedAt`

### ChatMessage (채팅 메시지)
- `id`, `sessionId`, `difyMessageId`
- `role`, `content`, `files`, `feedback`, `tokenCount`
- `createdAt`

### Admin (관리자) - Phase 8b, 9b
- `id`, `loginId`, `passwordHash`, `name`, `email`, `department`
- `role` (super_admin, admin)
- `isActive`, `lastLoginAt`, `lastLoginIp`
- `loginAttempts`, `lockedUntil` (Phase 9b - 로그인 시도 제한)
- `previousPasswordHash` (Phase 9b - 비밀번호 재사용 방지)
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

### AuditLog (감사 로그) - Phase 8b
- `id`
- `actorType`, `actorId`, `actorLoginId`, `actorName`, `actorRole`
- `action`, `entityType`, `entityId`
- `changes`, `metadata`
- `ipAddress`, `userAgent`, `requestPath`
- `success`, `errorMessage`
- `createdAt`

### ErrorLog (에러 로그) - Phase 8b
- `id`, `errorType`, `errorCode`, `message`, `stackTrace`
- `source`, `requestPath`, `requestMethod`
- `userEmpNo`, `adminId`, `sessionId`, `appId`
- `ipAddress`, `userAgent`
- `status` (new, investigating, resolved, ignored)
- `resolvedAt`, `resolvedBy`, `resolution`
- `createdAt`

### DailyUsageStats (일별 통계) - Phase 8b
- `id`, `date`, `appId`
- `totalSessions`, `newSessions`, `authSessions`, `anonymousSessions`
- `totalMessages`, `userMessages`, `assistantMessages`
- `uniqueUsers`, `totalTokens`
- `likeFeedbacks`, `dislikeFeedbacks`
- `createdAt`, `updatedAt`

### AdminGroup (관리자 그룹) - Phase 14
- `id`, `name`, `description`
- `isActive`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

### AdminGroupMember (그룹 멤버) - Phase 14
- `id`, `groupId`, `adminId`
- `createdAt`, `createdBy`
- Unique constraint: `(groupId, adminId)`

---

## 🔑 주요 기술적 결정 사항

### 1. API Key 암호화
- **이유**: DB 노출 시 API Key 보호
- **방식**: AES-256-GCM (인증된 암호화)
- **저장**: `{iv}:{authTag}:{encryptedData}` 형식

### 2. Repository 패턴
- **이유**: 암호화 로직 캡슐화, 재사용성
- **파일**: `lib/repositories/chatbot-app.ts`, `chat-session.ts`
- **타입 분리**: `ChatbotAppPublic` (API Key 제외), `ChatbotAppWithKey` (서버 전용)

### 3. Middleware 간소화
- **이유**: Edge Runtime에서 Prisma/crypto 사용 불가
- **해결**: Middleware에서 DB 조회 제거, API 라우트에서 권한 체크

### 4. 익명 사용자 sessionId
- **이유**: 쿠키 없이 세션 관리
- **방식**: sessionStorage에 UUID 저장 (Phase 9a 변경 - 공용 PC 보안)
- **폴백**: `crypto.randomUUID()` 미지원 환경 대응

### 5. 한글 이름 인코딩
- **이유**: HTTP 헤더에 한글 직접 전송 불가
- **방식**: Base64 인코딩

---

## ⚠️ 주의사항 및 제약

### 보안
- **ENCRYPTION_KEY**: 프로덕션 배포 전 반드시 새로 생성
- **JWT 키**: 안전하게 관리, .env.local에만 보관
- **공개 챗봇**: 민감 정보 포함 금지
- **익명 세션**: IP당 제한 고려 (현재 미구현)

### 성능
- **Prisma**: Connection pool 설정 확인
- **SSE**: 장시간 연결 시 타임아웃 설정

### 개발 환경
- **Windows symlink**: npm run build 시 권한 오류 발생 가능 (개발 모드는 정상)
- **PostgreSQL**: Docker 컨테이너 실행 필수

### 데이터
- **User 테이블 없음**: 사용자 정보는 JWT에만 존재
- **소프트 삭제**: ChatbotApp은 `isActive=false`로 표시

---

## 🧪 테스트

### 관리자 계정 (Phase 9b)
```
슈퍼관리자: superadmin / ChangeMe123!
```

### 익명 접속 테스트
1. 시크릿 모드로 `http://localhost:3000/` 접속
2. 공개 챗봇 선택 (익명 사용자는 "채팅 시작" 버튼 → 바로 심플형)
3. sessionId 생성 확인 (F12 > Application > Session Storage)
4. 메시지 전송 및 응답 확인
5. 같은 탭에서 새로고침 시 세션 복원 확인
6. 탭 닫고 다시 열면 새 세션 생성 확인

### 관리자 보안 테스트 (Phase 9b)
1. 로그인 N회 실패 → 계정 잠금 확인
2. 잠긴 계정으로 로그인 시도 → 잠금 메시지 표시
3. superadmin이 잠금 해제 → 로그인 가능
4. 비밀번호 정책 미충족 → 에러 메시지 확인

---

## 📝 코딩 컨벤션

- **TypeScript**: Strict mode, `any` 지양
- **Imports**: `@/*` 절대 경로
- **React**: Function components, Server components 기본
- **Styling**: Tailwind-first
- **ESLint**: `@antfu/eslint-config` (single quotes, 2-space indent, no semicolons)

---

## 🤖 Claude Code 작업 규칙

### Context7 MCP 사용
다음 상황에서는 **반드시 Context7 MCP 서버**를 사용하여 최신 라이브러리/API 문서를 참조할 것:

1. **코드 생성 시**: 새로운 기능 구현, 컴포넌트 작성, API 라우트 생성
2. **설정 및 구성 시**: 라이브러리 설정, 빌드 구성, 환경 설정
3. **라이브러리/API 문서 필요 시**: 사용법 확인, 타입 정의, 옵션 파라미터 확인

**주요 대상 라이브러리**:
- Next.js 15
- React 19
- Prisma 7
- Tailwind CSS 4
- Radix UI
- jose (JWT)
- Dify API

---

## 🐛 알려진 이슈

1. **Windows symlink 오류** (낮은 우선순위)
   - 증상: `npm run build` 시 standalone 생성 실패
   - 영향: 없음 (개발 모드 정상 동작)
   - 해결: 관리자 권한 또는 Linux 환경

2. **crypto.randomUUID() 미지원** (해결됨)
   - 해결: 폴백 함수 추가

---

## 📚 참고 문서

- [Next.js 15 문서](https://nextjs.org/docs)
- [Prisma 7 문서](https://www.prisma.io/docs)
- [Dify API 문서](https://docs.dify.ai/)
- [jose (JWT) 문서](https://github.com/panva/jose)

---

**마지막 업데이트**: 2026-02-09
**Phase 10-2 완료**: API 응답 포맷 통일 (에러 status 코드 수정, try-catch 추가, 공통 헬퍼)
**Phase 14 완료**: 관리자 그룹 관리 + 역할별 접근 제어
**관리자 경로 보안**: `NEXT_PUBLIC_ADMIN_BASE_PATH` 환경변수로 URL 변경
**다음 단계**: Phase 13 보안 검토 (배포 전 진행 예정)
