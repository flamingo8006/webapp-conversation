# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드입니다.

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

---

## 🔄 현재 진행 중인 작업

**상태**: Phase 8a 보완 테스트 완료

**최근 완료한 작업** (2026-02-03):
- ✅ 포털 메인 화면 다국어 지원 (번역 키 추가, 언어 선택 버튼)
- ✅ 챗봇 이름/설명 다국어 지원 (DB 스키마, Repository, API, UI)
- ✅ 기존 데이터 마이그레이션 완료
- ✅ 심플형 채팅 화면 다국어 앱 이름 표시 버그 수정

**알려진 버그**:
- Windows에서 Next.js standalone 빌드 시 symlink 권한 오류 (개발 모드는 정상 동작)

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

### 우선순위 1: Phase 8b - 관리 인프라
- [ ] 사용자/그룹 관리 (User, Department, UserRole 추가)
- [ ] 감사 로그 (AuditLog)
- [ ] 사용 통계 대시보드 (UsageStats)
- [ ] 에러 모니터링 (ErrorLog)

### 우선순위 2: Phase 8c - 디자인 명세 대기
- [ ] 앱형 UI 변경 (디자인 명세 제공 후)

### 우선순위 3: 기능 검토
- [ ] **앱형 익명 사용자 사용 여부 검토**
  - 앱형은 대화 히스토리가 계속 기록됨
  - 익명 사용자에게 앱형 허용 시 보안/관리 이슈 검토 필요
  - 심플형만 익명 허용 또는 앱형도 허용할지 결정

### 우선순위 4: 프로덕션 준비
- [ ] E2E 테스트 작성
- [ ] 보안 검토
- [ ] 성능 최적화
- [ ] 에러 핸들링 강화
- [ ] 로깅 시스템

### 우선순위 5: 레거시 인증 연동 후 테스트
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
│   │   └── layout.tsx          # 관리자 레이아웃 (사이드바)
│   ├── (auth)/login/           # 로그인 페이지
│   ├── (portal)/chat/[appId]/  # 포털 채팅 페이지
│   ├── simple-chat/[appId]/    # 심플형 채팅 페이지
│   │
│   ├── api/
│   │   ├── auth/               # 인증 API
│   │   ├── admin/apps/         # 관리자 API (인증 필수)
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
│   └── repositories/
│       ├── chatbot-app.ts      # 챗봇 앱 Repository
│       ├── chatbot-app-edge.ts # Edge Runtime용 (사용 안함)
│       └── chat-session.ts     # 채팅 세션 Repository
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

# 인증 모드
AUTH_MODE=mock  # 'mock' 또는 'legacy'
LEGACY_AUTH_API_URL=https://portal.dgist.ac.kr/api/auth/login

# 레거시 (하위 호환용, Phase 7 이후 제거 가능)
NEXT_PUBLIC_APP_ID=your-dify-app-id
NEXT_PUBLIC_APP_KEY=your-dify-api-key
NEXT_PUBLIC_API_URL=https://api.dify.ai/v1
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
- **sessionId**: localStorage에 UUID 저장
- **자동 생성**: 최초 공개 챗봇 접속 시
- **세션 복원**: sessionId + appId로 이전 대화 복원

### Middleware 경로 규칙

| 경로 | 인증 요구 | 비고 |
|------|----------|------|
| `/login`, `/api/auth/*` | 불필요 | 공개 |
| `/simple-chat/[appId]` | 조건부 | 챗봇 설정에 따라 결정 |
| `/`, `/api/apps/public`, `/api/apps/[appId]/info` | 불필요 | 공개 API |
| `/chat/[appId]` | 쿠키 | 인증 필수 |
| `/admin/*`, `/api/admin/*` | 쿠키 + role=admin | 관리자 전용 |
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
- `isActive`, `lastMessageAt`, `createdAt`, `updatedAt`

### ChatMessage (채팅 메시지)
- `id`, `sessionId`, `difyMessageId`
- `role`, `content`, `files`, `feedback`, `tokenCount`
- `createdAt`

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
- **방식**: localStorage에 UUID 저장
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

### Mock 사용자
```
관리자: admin / admin123
일반: user / user123
```

### 익명 접속 테스트
1. 시크릿 모드로 `http://localhost:3000/` 접속
2. 공개 챗봇 선택
3. sessionId 생성 확인 (F12 > Application > Local Storage)
4. 메시지 전송 및 응답 확인
5. 새로고침 시 세션 복원 확인

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

**마지막 업데이트**: 2026-02-03
**Phase 8a 완료**: 다국어 지원, 레퍼런스 표시, 멀티모달 익명 지원
