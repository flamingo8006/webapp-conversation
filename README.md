# DGIST Agentic AI 플랫폼 - Webapp 포털

Next.js 기반의 멀티 챗봇 포털 애플리케이션입니다. Dify 플랫폼과 연동하여 여러 AI 챗봇을 관리하고 사용자에게 제공합니다.

## 주요 기능

- ✅ **멀티 앱 포털**: 여러 챗봇을 하나의 포털에서 관리
- ✅ **인증 시스템**: JWT 기반 레거시 인증 연동
- ✅ **관리자 콘솔**: 챗봇 생성/수정/삭제 및 설정 관리
- ✅ **공개 챗봇**: 인증 없이 접근 가능한 공개 챗봇 지원
- ✅ **익명 사용자**: 로그인 없이 챗봇 사용 가능 (Phase 7)
- ✅ **보안**: API Key AES-256-GCM 암호화 저장
- ✅ **대화 이력**: PostgreSQL에 대화 내용 저장
- ✅ **실시간 스트리밍**: SSE(Server-Sent Events)로 실시간 응답
- ✅ **파일 업로드**: 이미지 및 문서 업로드 지원
- ✅ **다국어**: 한국어, 영어, 일본어, 중국어, 프랑스어, 스페인어

## 기술 스택

- **프레임워크**: Next.js 15.5 (App Router)
- **언어**: TypeScript 5
- **데이터베이스**: PostgreSQL 15 + Prisma 7
- **인증**: JWT (RS256, jose)
- **암호화**: AES-256-GCM (API Key 저장)
- **스타일링**: Tailwind CSS + SCSS
- **패키지 매니저**: pnpm

## 시작하기

### 1. 사전 요구사항

- Node.js 18.18 이상
- PostgreSQL 15 (Docker Compose로 실행 가능)
- pnpm 9 이상

### 2. 저장소 클론

```bash
git clone <repository-url>
cd webapp-conversation
```

### 3. 의존성 설치

```bash
pnpm install
```

### 4. 데이터베이스 설정

#### Docker로 PostgreSQL 실행

```bash
docker-compose -f docker-compose.dev.yml up -d
```

이 명령은 PostgreSQL 15를 포트 5432에서 실행합니다.

#### Prisma 마이그레이션

```bash
npx prisma migrate dev
```

### 5. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# 데이터베이스
DATABASE_URL="postgresql://chatbot:chatbot123@localhost:5432/chatbot"

# JWT 인증 (RS256 키페어 필요)
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_ISSUER="dgist-auth"
JWT_AUDIENCE="dgist-chatbot"

# API Key 암호화 (32바이트 Base64 키)
# 생성: openssl rand -base64 32
ENCRYPTION_KEY="K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols="

# 인증 모드
AUTH_MODE="mock"  # 개발: 'mock', 프로덕션: 'legacy'
LEGACY_AUTH_API_URL="https://portal.dgist.ac.kr/api/auth/login"

# (선택) 레거시 단일 앱 설정 (Phase 7 이후 제거 가능)
NEXT_PUBLIC_APP_ID=""
NEXT_PUBLIC_APP_KEY=""
NEXT_PUBLIC_API_URL="https://api.dify.ai/v1"
```

#### JWT 키페어 생성

```bash
# 개인키 생성
openssl genrsa -out private.pem 2048

# 공개키 추출
openssl rsa -in private.pem -pubout -out public.pem

# 환경변수용으로 변환 (줄바꿈을 \n으로)
cat private.pem | sed ':a;N;$!ba;s/\n/\\n/g'
cat public.pem | sed ':a;N;$!ba;s/\n/\\n/g'
```

### 6. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 포털 페이지를 확인하세요.

## 스크립트 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 (포트 3000) |
| `pnpm build` | 프로덕션 빌드 생성 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 검사 |
| `pnpm fix` | ESLint 자동 수정 |
| `npx prisma studio` | Prisma Studio (DB GUI) 실행 |
| `npx prisma migrate dev` | 마이그레이션 생성 및 실행 |
| `npx prisma generate` | Prisma Client 재생성 |

## 프로젝트 구조

```
webapp-conversation/
├── app/
│   ├── (auth)/          # 인증 관련 페이지 (로그인)
│   ├── (admin)/         # 관리자 콘솔
│   ├── (portal)/        # 사용자 포털 (챗봇 선택, 채팅)
│   ├── simple-chat/     # 공개 챗봇 페이지
│   ├── api/             # API 라우트
│   │   ├── auth/        # 인증 API
│   │   ├── admin/       # 관리자 API
│   │   └── apps/        # 앱별 API (채팅, 대화 이력)
│   └── components/      # React 컴포넌트
├── lib/
│   ├── prisma.ts        # Prisma 클라이언트
│   ├── jwt.ts           # JWT 유틸리티
│   ├── encryption.ts    # API Key 암호화
│   ├── session-manager.ts  # 클라이언트 세션 관리
│   └── repositories/    # DB Repository 패턴
├── prisma/
│   └── schema.prisma    # 데이터베이스 스키마
├── middleware.ts        # Next.js 미들웨어 (인증)
├── hooks/               # React 커스텀 훅
├── service/             # API 클라이언트 (Dify 연동)
└── types/               # TypeScript 타입 정의
```

## 첫 번째 챗봇 생성하기

### 1. Mock 관리자로 로그인

개발 환경에서는 Mock 인증을 사용합니다:

```
아이디: admin
비밀번호: admin123
```

### 2. 관리자 콘솔 접속

로그인 후 우측 상단의 "관리자" 버튼을 클릭하여 관리자 콘솔로 이동합니다.

### 3. 챗봇 생성

1. "새 챗봇 만들기" 버튼 클릭
2. 다음 정보 입력:
   - **챗봇 이름**: 사용자에게 표시될 이름
   - **설명**: 챗봇 설명
   - **Dify App ID**: Dify 대시보드의 앱 URL에서 확인 (예: `https://cloud.dify.ai/app/xxx/workflow`의 `xxx`)
   - **API Key**: Dify 앱의 "API Access" 페이지에서 생성
   - **API URL**: 기본값 `https://api.dify.ai/v1` (또는 자체 호스팅 URL)
3. **공개 설정** (Phase 7):
   - **공개 챗봇**: 포털에 노출 여부
   - **인증 필수**: 로그인 필수 여부
   - **익명 허용**: 로그인 없이 사용 가능 (공개 챗봇일 때만)
   - **익명 메시지 제한**: 익명 사용자당 최대 메시지 수 (0=무제한)
4. "저장" 버튼 클릭

### 4. 챗봇 사용하기

- **인증 사용자**: 포털(`/`) → 챗봇 카드 클릭 → 채팅 타입 선택
- **익명 사용자**: 공개 챗봇 URL 직접 접속 (`/simple-chat/[appId]`)

## 인증 방식

### Mock 인증 (개발용)

`AUTH_MODE=mock` 설정 시 사용:

| 아이디 | 비밀번호 | 권한 |
|--------|----------|------|
| admin | admin123 | 관리자 |
| user | user123 | 일반 사용자 |

### 레거시 인증 (프로덕션)

`AUTH_MODE=legacy` 설정 시 `LEGACY_AUTH_API_URL`로 외부 인증 API를 호출합니다.

### 익명 사용자 (Phase 7)

- **식별**: 브라우저 localStorage에 UUID 저장
- **세션**: `sessionId` + `appId`로 대화 이력 관리
- **제한**: 챗봇별로 메시지 수 제한 가능

## Docker 배포

### 빌드 및 실행

```bash
docker build . -t dgist-chatbot:latest
docker run -p 3000:3000 --env-file .env.local dgist-chatbot:latest
```

### Docker Compose (개발 환경)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

PostgreSQL이 포트 5432에서 실행됩니다.

## 보안 고려사항

- **API Key 암호화**: 모든 Dify API Key는 AES-256-GCM으로 암호화되어 DB에 저장됩니다.
- **JWT**: HttpOnly 쿠키로 저장하여 XSS 공격 방지
- **ENCRYPTION_KEY**: 프로덕션 환경에서는 반드시 새로운 키를 생성하세요 (`openssl rand -base64 32`)
- **JWT 키**: 프로덕션에서는 안전한 키 관리 시스템 사용 권장
- **익명 사용자**: Rate Limiting 및 메시지 제한으로 어뷰징 방지

## 개발 가이드

자세한 개발 가이드, 아키텍처, 코딩 규칙은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 라이선스

이 프로젝트는 DGIST의 소유입니다.

## 문의

문제가 발생하거나 질문이 있는 경우, 이슈를 등록하거나 담당자에게 문의하세요.
