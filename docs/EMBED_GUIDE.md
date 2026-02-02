# 챗봇 Embed 통합 가이드

DGIST AI 챗봇을 외부 웹사이트에 삽입하는 방법을 설명합니다.

## 목차

1. [빠른 시작](#빠른-시작)
2. [인증 토큰 발급](#인증-토큰-발급)
3. [iframe 삽입](#iframe-삽입)
4. [채팅 제어](#채팅-제어)
5. [보안 설정](#보안-설정)
6. [커스터마이징](#커스터마이징)

---

## 빠른 시작

### 1. 샘플 페이지 확인

```
http://localhost:3000/embed-sample.html
```

브라우저에서 위 URL을 열어 Embed 샘플을 확인하세요.

### 2. 기본 구조

```html
<!-- 1. iframe 추가 -->
<iframe
  id="dgist-chatbot"
  src="https://your-domain.com/embed/{APP_ID}?token={JWT_TOKEN}"
  style="position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; border: none; pointer-events: none; z-index: 9999;"
  allow="clipboard-write"
></iframe>

<!-- 2. 제어 스크립트 -->
<script>
  const chatFrame = document.getElementById('dgist-chatbot');

  function openChat() {
    chatFrame.contentWindow.postMessage({ type: 'OPEN_CHAT' }, '*');
  }
</script>
```

---

## 인증 토큰 발급

### API 엔드포인트

```
POST /api/auth/embed-token
```

### 요청 예시

```javascript
const response = await fetch('https://your-domain.com/api/auth/embed-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 프로덕션: API Key 인증 필요
    // 'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    loginId: 'user123',      // 사용자 로그인 ID
    empNo: '20210001',       // 사원번호
    name: '홍길동',          // 이름
    role: 'user'            // 권한 (user | admin)
  })
});

const data = await response.json();
const token = data.token; // JWT 토큰
```

### 응답 예시

```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600
}
```

---

## iframe 삽입

### 기본 설정

```html
<iframe
  id="dgist-chatbot"
  src="https://your-domain.com/embed/{APP_ID}?token={JWT_TOKEN}"
  style="position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; border: none; pointer-events: none; z-index: 9999;"
  allow="clipboard-write"
></iframe>
```

### 스타일 설명

| 속성 | 값 | 설명 |
|------|-----|------|
| `position` | `fixed` | 화면에 고정 |
| `bottom` | `0` | 하단 배치 |
| `right` | `0` | 우측 배치 |
| `width` | `100%` | 전체 너비 |
| `height` | `100%` | 전체 높이 |
| `border` | `none` | 테두리 제거 |
| `pointer-events` | `none` | 배경 클릭 가능 (플로팅 버튼은 클릭 가능) |
| `z-index` | `9999` | 최상위 레이어 |

---

## 채팅 제어

### postMessage API

부모 창에서 iframe으로 메시지를 보내 채팅을 제어할 수 있습니다.

#### 채팅 열기

```javascript
chatFrame.contentWindow.postMessage({ type: 'OPEN_CHAT' }, '*');
```

#### 채팅 닫기

```javascript
chatFrame.contentWindow.postMessage({ type: 'CLOSE_CHAT' }, '*');
```

#### 채팅 토글

```javascript
chatFrame.contentWindow.postMessage({ type: 'TOGGLE_CHAT' }, '*');
```

### 상태 수신

챗봇에서 부모 창으로 상태를 전송합니다.

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'CHAT_STATUS') {
    const { isOpen, unreadCount } = event.data.data;
    console.log('채팅 열림:', isOpen);
    console.log('읽지 않은 메시지:', unreadCount);
  }
});
```

---

## 보안 설정

### 1. 프로덕션 환경 설정

**환경변수 (.env.production)**

```bash
# Embed API Key (토큰 발급 인증용)
EMBED_API_KEY=your-secret-api-key

# 허용 도메인 (CORS)
ALLOWED_ORIGINS=https://your-domain.com,https://another-domain.com
```

### 2. API Key 인증

토큰 발급 API에 API Key 인증을 추가하세요.

```javascript
// app/api/auth/embed-token/route.ts
const apiKey = request.headers.get('X-API-Key');
if (apiKey !== process.env.EMBED_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. Origin 검증

postMessage 수신 시 origin을 검증하세요.

```javascript
window.addEventListener('message', (event) => {
  // 신뢰할 수 있는 도메인만 허용
  if (event.origin !== 'https://trusted-domain.com') {
    return;
  }

  // 메시지 처리...
});
```

### 4. SameSite 쿠키 설정

Embed 모드에서는 `SameSite=None; Secure` 설정이 필요합니다.

이미 `middleware.ts`에서 처리되어 있습니다:

```typescript
response.cookies.set('embed_auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none', // iframe에서 접근 가능
  maxAge: 60 * 60 * 24,
});
```

---

## 커스터마이징

### 플로팅 버튼 위치 변경

iframe 크기와 위치를 조정하여 버튼 위치를 변경할 수 있습니다.

**왼쪽 하단:**

```html
<iframe
  style="position: fixed; bottom: 0; left: 0; ..."
></iframe>
```

**우측 상단:**

```html
<iframe
  style="position: fixed; top: 0; right: 0; ..."
></iframe>
```

### 특정 페이지에만 표시

```javascript
// 특정 경로에서만 챗봇 로드
if (window.location.pathname === '/support') {
  loadChatbot();
}
```

### 자동 열기

페이지 로드 시 자동으로 채팅을 열 수 있습니다.

```javascript
window.addEventListener('load', () => {
  setTimeout(() => {
    openChat();
  }, 2000); // 2초 후 자동 열기
});
```

---

## 예제 코드

### 완전한 통합 예제

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>My Website</title>
</head>
<body>
  <h1>환영합니다</h1>
  <button onclick="openChat()">고객 지원</button>

  <!-- 챗봇 iframe -->
  <iframe id="dgist-chatbot" style="..."></iframe>

  <script>
    const APP_ID = 'your-app-id';
    const chatFrame = document.getElementById('dgist-chatbot');

    // 1. 토큰 발급
    async function getToken() {
      const response = await fetch('https://your-domain.com/api/auth/embed-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-api-key'
        },
        body: JSON.stringify({
          loginId: getCurrentUserId(),
          empNo: getCurrentUserEmpNo(),
          name: getCurrentUserName(),
          role: 'user'
        })
      });

      const data = await response.json();
      return data.token;
    }

    // 2. iframe 초기화
    async function initChatbot() {
      const token = await getToken();
      chatFrame.src = `https://your-domain.com/embed/${APP_ID}?token=${token}`;
    }

    // 3. 채팅 제어
    function openChat() {
      chatFrame.contentWindow.postMessage({ type: 'OPEN_CHAT' }, '*');
    }

    // 4. 상태 수신
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://your-domain.com') return;

      if (event.data.type === 'CHAT_STATUS') {
        console.log('Chat status:', event.data.data);
      }
    });

    // 페이지 로드 시 초기화
    initChatbot();
  </script>
</body>
</html>
```

---

## 문제 해결

### iframe이 표시되지 않음

1. JWT 토큰이 유효한지 확인
2. APP_ID가 정확한지 확인
3. 브라우저 콘솔에서 오류 확인
4. 네트워크 탭에서 요청 상태 확인

### 쿠키가 저장되지 않음

- HTTPS 환경에서 `SameSite=None; Secure` 설정 확인
- 브라우저의 3rd-party 쿠키 차단 설정 확인

### postMessage가 작동하지 않음

- iframe이 완전히 로드된 후 메시지 전송
- origin 검증 코드 확인
- 브라우저 콘솔에서 오류 확인

---

## 지원

문제가 발생하면 다음을 확인하세요:

1. 샘플 페이지: `http://localhost:3000/embed-sample.html`
2. 브라우저 개발자 도구 콘솔
3. 네트워크 탭에서 API 요청 상태

추가 도움이 필요하면 관리자에게 문의하세요.
