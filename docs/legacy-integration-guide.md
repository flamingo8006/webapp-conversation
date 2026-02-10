# DGIST AI 포털 - 레거시 시스템 연동 가이드

> **대상 독자**: Java/Spring 기반 레거시 시스템 개발자
> **최종 수정**: 2026-02-10
> **버전**: 1.0

---

## 목차

1. [개요](#1-개요)
2. [시나리오 1: AI 포털 접속 (Legacy Portal -> Chatbot)](#2-시나리오-1-ai-포털-접속)
   - [2.1 흐름도](#21-흐름도)
   - [2.2 API 명세: POST /api/auth/embed-token](#22-api-명세-post-apiauthembed-token)
   - [2.3 API 명세: POST /api/auth/token](#23-api-명세-post-apiauthtoken)
   - [2.4 Java 구현 예제 (HttpURLConnection)](#24-java-구현-예제-httpurlconnection)
   - [2.5 Java 구현 예제 (Spring RestTemplate)](#25-java-구현-예제-spring-resttemplate)
   - [2.6 JSP 자동 제출 폼 예제](#26-jsp-자동-제출-폼-예제)
3. [시나리오 2: 익명 임베드](#3-시나리오-2-익명-임베드)
4. [시나리오 3: 인증형 임베드 (HMAC 서명)](#4-시나리오-3-인증형-임베드)
   - [4.1 흐름도](#41-흐름도)
   - [4.2 Part A: 임베딩 시스템 측 (Java)](#42-part-a-임베딩-시스템-측-java)
   - [4.3 Part B: 레거시 시스템 측 - 사용자 확인 API](#43-part-b-레거시-시스템-측---사용자-확인-api)
5. [공통 정보](#5-공통-정보)
   - [5.1 API 엔드포인트 요약](#51-api-엔드포인트-요약)
   - [5.2 환경변수](#52-환경변수)
   - [5.3 에러 코드 매핑](#53-에러-코드-매핑)
   - [5.4 curl 테스트 예제](#54-curl-테스트-예제)
   - [5.5 보안 주의사항](#55-보안-주의사항)

---

## 1. 개요

DGIST AI 포털(챗봇 시스템)은 기존 레거시 포털 시스템과 3가지 방식으로 연동할 수 있습니다.

| 시나리오 | 용도 | 인증 방식 | 레거시 측 작업 |
|---------|------|----------|--------------|
| **시나리오 1** | 포털에서 AI 챗봇 페이지로 이동 | API Key + JWT | 서버 측 토큰 발급 + JSP 폼 전송 |
| **시나리오 2** | 공개 챗봇을 iframe으로 삽입 | 없음 (익명) | iframe 태그 추가만 필요 |
| **시나리오 3** | 인증된 사용자용 챗봇을 iframe으로 삽입 | HMAC-SHA256 서명 | HMAC 서명 생성 + 사용자 확인 API 제공 |

**기술 스택 요약**:
- 챗봇 시스템: Next.js 15, JWT(RS256), PostgreSQL
- 레거시 시스템: Java/Spring 기반 (이 문서에서 가정)
- 인증 토큰: JWT (RS256 알고리즘, jose 라이브러리)
- 토큰 유효기간: 기본 8시간 (환경변수로 조정 가능)

---

## 2. 시나리오 1: AI 포털 접속

레거시 포털에서 "AI 챗봇" 메뉴를 클릭하면, 서버 측에서 JWT 토큰을 발급받고 사용자의 브라우저가 챗봇 시스템으로 자동 로그인됩니다.

### 2.1 흐름도

```
사용자 브라우저          레거시 포털 서버            챗봇 시스템
     |                       |                        |
     |-- "AI 챗봇" 클릭 --->|                        |
     |                       |-- POST /api/auth/embed-token -->|
     |                       |   (X-API-Key + 사용자 정보)     |
     |                       |<-- { token: "eyJ..." } ---------|
     |                       |                        |
     |<-- HTML (auto-submit form) --|                 |
     |                       |                        |
     |-- POST /api/auth/token (form data) ----------->|
     |   (token=eyJ...)                               |
     |<-- 302 Redirect + Set-Cookie(auth_token) ------|
     |                       |                        |
     |-- GET / (with cookie) ----------------------->|
     |<-- AI 포털 메인 페이지 ------------------------|
```

### 2.2 API 명세: POST /api/auth/embed-token

챗봇 시스템이 제공하는 토큰 발급 API입니다. 레거시 서버에서 서버-to-서버로 호출합니다.

**요청**:

```
POST /api/auth/embed-token
Host: {CHATBOT_HOST}
Content-Type: application/json
X-API-Key: {EMBED_API_KEY}
```

```json
{
  "loginId": "hong123",
  "empNo": "EMP001",
  "name": "홍길동",
  "role": "user"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `loginId` | string | O | 사용자 로그인 ID |
| `empNo` | string | O | 사원번호 |
| `name` | string | O | 사용자 이름 (한글 가능) |
| `role` | string | X | 역할 (기본값: `"user"`) |

**성공 응답** (200):

```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 28800
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | boolean | 성공 여부 |
| `token` | string | JWT 토큰 (RS256 서명) |
| `expiresIn` | number | 토큰 유효기간 (초 단위, 기본 28800 = 8시간) |

**에러 응답**:

| HTTP 상태 | 응답 본문 | 원인 |
|-----------|----------|------|
| 503 | `{ "error": "Embed token endpoint is not configured" }` | 서버에 `EMBED_API_KEY` 미설정 |
| 401 | `{ "error": "Unauthorized" }` | `X-API-Key` 값 불일치 |
| 400 | `{ "error": "loginId, empNo, name are required" }` | 필수 필드 누락 |
| 500 | `{ "error": "Internal server error" }` | 서버 내부 오류 |

### 2.3 API 명세: POST /api/auth/token

브라우저가 JWT 토큰을 제출하면, 챗봇 시스템이 쿠키를 설정하고 메인 페이지로 리다이렉트합니다.

**요청** (HTML Form POST):

```
POST /api/auth/token
Host: {CHATBOT_HOST}
Content-Type: application/x-www-form-urlencoded

token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**성공**: HTTP 302 리다이렉트

```
HTTP/1.1 302 Found
Location: /
Set-Cookie: auth_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=28800; Path=/
```

**실패**: HTTP 302 리다이렉트 (에러 페이지로)

```
HTTP/1.1 302 Found
Location: /login?error=invalid_token
```

| 에러 파라미터 | 원인 |
|-------------|------|
| `missing_token` | 폼에 token 필드 없음 |
| `invalid_token` | JWT 검증 실패 (만료, 서명 불일치 등) |
| `server_error` | 서버 내부 오류 |

### 2.4 Java 구현 예제 (HttpURLConnection)

```java
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class ChatbotTokenService {

    private static final String CHATBOT_HOST = "https://ai-chatbot.dgist.ac.kr";
    private static final String EMBED_API_KEY = "your-embed-api-key-here";

    /**
     * 챗봇 시스템에 JWT 토큰을 요청합니다.
     *
     * @param loginId 사용자 로그인 ID
     * @param empNo   사원번호
     * @param name    사용자 이름
     * @return JWT 토큰 문자열, 실패 시 null
     */
    public String requestChatbotToken(String loginId, String empNo, String name) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(CHATBOT_HOST + "/api/auth/embed-token");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-API-Key", EMBED_API_KEY);
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            // 요청 본문 작성
            String jsonBody = String.format(
                "{\"loginId\":\"%s\",\"empNo\":\"%s\",\"name\":\"%s\",\"role\":\"user\"}",
                escapeJson(loginId),
                escapeJson(empNo),
                escapeJson(name)
            );

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                // 에러 응답 읽기
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line);
                    }
                    System.err.println("토큰 발급 실패 (HTTP " + responseCode + "): " + sb);
                }
                return null;
            }

            // 성공 응답 파싱
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }
                String responseBody = sb.toString();

                // 간단한 JSON 파싱 (프로덕션에서는 Jackson/Gson 사용 권장)
                int tokenStart = responseBody.indexOf("\"token\":\"") + 9;
                int tokenEnd = responseBody.indexOf("\"", tokenStart);
                return responseBody.substring(tokenStart, tokenEnd);
            }

        } catch (Exception e) {
            System.err.println("챗봇 토큰 요청 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return null;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                     .replace("\"", "\\\"")
                     .replace("\n", "\\n")
                     .replace("\r", "\\r");
    }
}
```

### 2.5 Java 구현 예제 (Spring RestTemplate)

```java
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ChatbotTokenService {

    private final RestTemplate restTemplate;

    // application.properties 또는 application.yml에서 주입
    @Value("${chatbot.host}")
    private String chatbotHost;

    @Value("${chatbot.embed-api-key}")
    private String embedApiKey;

    public ChatbotTokenService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * 챗봇 시스템에 JWT 토큰을 요청합니다.
     *
     * @param loginId 사용자 로그인 ID
     * @param empNo   사원번호
     * @param name    사용자 이름
     * @return JWT 토큰 문자열
     * @throws ChatbotTokenException 토큰 발급 실패 시
     */
    public String requestChatbotToken(String loginId, String empNo, String name) {
        String url = chatbotHost + "/api/auth/embed-token";

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", embedApiKey);

        // 요청 본문
        Map<String, String> body = new HashMap<>();
        body.put("loginId", loginId);
        body.put("empNo", empNo);
        body.put("name", name);
        body.put("role", "user");

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && Boolean.TRUE.equals(responseBody.get("success"))) {
                return (String) responseBody.get("token");
            }

            throw new ChatbotTokenException("토큰 발급 응답이 올바르지 않습니다.");

        } catch (HttpClientErrorException e) {
            throw new ChatbotTokenException(
                "토큰 발급 실패 (HTTP " + e.getStatusCode() + "): " + e.getResponseBodyAsString()
            );
        }
    }
}

// 예외 클래스
public class ChatbotTokenException extends RuntimeException {
    public ChatbotTokenException(String message) {
        super(message);
    }
}
```

**application.yml 설정**:

```yaml
chatbot:
  host: https://ai-chatbot.dgist.ac.kr
  embed-api-key: ${EMBED_API_KEY}
```

**Spring Controller 예제**:

```java
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import javax.servlet.http.HttpSession;

@Controller
public class ChatbotController {

    private final ChatbotTokenService tokenService;

    @Value("${chatbot.host}")
    private String chatbotHost;

    public ChatbotController(ChatbotTokenService tokenService) {
        this.tokenService = tokenService;
    }

    /**
     * "AI 챗봇" 메뉴 클릭 시 호출됩니다.
     * 토큰을 발급받아 자동 제출 폼이 있는 JSP 페이지를 렌더링합니다.
     */
    @GetMapping("/portal/ai-chatbot")
    public String redirectToChatbot(HttpSession session, Model model) {
        // 현재 로그인된 사용자 정보 (레거시 세션에서 가져옴)
        String loginId = (String) session.getAttribute("loginId");
        String empNo = (String) session.getAttribute("empNo");
        String name = (String) session.getAttribute("name");

        if (loginId == null || empNo == null || name == null) {
            return "redirect:/login";
        }

        try {
            String token = tokenService.requestChatbotToken(loginId, empNo, name);
            model.addAttribute("chatbotHost", chatbotHost);
            model.addAttribute("token", token);
            return "chatbot-redirect";  // chatbot-redirect.jsp 렌더링
        } catch (ChatbotTokenException e) {
            model.addAttribute("errorMessage", "AI 챗봇 접속에 실패했습니다: " + e.getMessage());
            return "error";
        }
    }
}
```

### 2.6 JSP 자동 제출 폼 예제

**chatbot-redirect.jsp**:

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI 챗봇으로 이동 중...</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: 'Malgun Gothic', sans-serif;
            background-color: #f5f5f5;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e0e0e0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p>AI 챗봇으로 이동 중입니다...</p>
    </div>

    <!-- 자동 제출 폼 -->
    <form id="chatbotForm"
          method="POST"
          action="${chatbotHost}/api/auth/token"
          style="display: none;">
        <input type="hidden" name="token" value="${token}" />
    </form>

    <script>
        // 페이지 로드 완료 시 자동 제출
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('chatbotForm').submit();
        });
    </script>

    <!-- JavaScript 비활성화 시 수동 제출 지원 -->
    <noscript>
        <form method="POST" action="${chatbotHost}/api/auth/token">
            <input type="hidden" name="token" value="${token}" />
            <button type="submit">AI 챗봇으로 이동</button>
        </form>
    </noscript>
</body>
</html>
```

**Thymeleaf 버전** (`chatbot-redirect.html`):

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>AI 챗봇으로 이동 중...</title>
</head>
<body>
    <div class="loading">
        <p>AI 챗봇으로 이동 중입니다...</p>
    </div>

    <form id="chatbotForm"
          method="POST"
          th:action="${chatbotHost + '/api/auth/token'}"
          style="display: none;">
        <input type="hidden" name="token" th:value="${token}" />
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('chatbotForm').submit();
        });
    </script>
</body>
</html>
```

---

## 3. 시나리오 2: 익명 임베드

공개 챗봇을 외부 페이지에 iframe으로 삽입하는 방식입니다. **레거시 시스템에서 별도의 코드 변경이 필요하지 않습니다.**

### 전제 조건

- 챗봇의 `allowAnonymous` 설정이 `true`여야 합니다 (관리자 콘솔에서 설정).
- 챗봇이 활성 상태(`isActive=true`)이고 공개(`isPublic=true`)여야 합니다.

### 사용 방법

아래와 같이 iframe 태그를 HTML 페이지에 추가하면 됩니다.

**화면 배치형 (전체 영역)**:

```html
<iframe
    src="https://ai-chatbot.dgist.ac.kr/simple-chat/{appId}"
    width="100%"
    height="600"
    frameborder="0"
    allow="microphone"
    style="border: 1px solid #e0e0e0; border-radius: 8px;">
</iframe>
```

**JSP 예제**:

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<div class="chatbot-container">
    <h3>AI 상담</h3>
    <iframe
        src="https://ai-chatbot.dgist.ac.kr/simple-chat/${appId}"
        width="100%"
        height="500"
        frameborder="0"
        allow="microphone"
        style="border: 1px solid #e0e0e0; border-radius: 8px;">
    </iframe>
</div>
```

### 제한사항

- 익명 사용자는 심플형 채팅만 사용 가능 (앱형 불가)
- 챗봇에 `maxAnonymousMsgs` 설정 시 메시지 수 제한 적용
- 세션은 브라우저 탭을 닫으면 초기화됨 (sessionStorage 기반)

---

## 4. 시나리오 3: 인증형 임베드

iframe으로 챗봇을 삽입하되, 현재 로그인된 사용자의 인증 정보를 전달하는 방식입니다. HMAC-SHA256 서명으로 사용자 정보의 무결성을 보장합니다.

### 4.1 흐름도

```
사용자 브라우저     레거시 포털 서버     챗봇 시스템     레거시 사용자 확인 API
     |                  |                   |                    |
     |-- 페이지 로드 -->|                   |                    |
     |                  |                   |                    |
     |  [서버 측: HMAC 서명 생성]            |                    |
     |  canonical = loginId={v}&empNo={v}&name={v}&ts={v}        |
     |  sig = HMAC-SHA256(canonical, SECRET)  |                  |
     |                  |                   |                    |
     |<-- iframe URL 포함 HTML --|          |                    |
     |                  |                   |                    |
     |-- GET /embed/{appId}?loginId=...&sig=... --------------->|
     |                  |                   |                    |
     |                  |    [챗봇 측: HMAC 서명 검증]            |
     |                  |    [챗봇 측: 타임스탬프 유효성 (5분)]     |
     |                  |                   |                    |
     |                  |                   |-- POST /api/verify-user -->|
     |                  |                   |   { loginId, empNo }      |
     |                  |                   |<-- { name, role, ... } ---|
     |                  |                   |                    |
     |                  |    [챗봇 측: JWT 발급 + embed_auth_token 쿠키 설정]
     |                  |                   |                    |
     |<-- 인증된 챗봇 페이지 --------------|                    |
```

### 4.2 Part A: 임베딩 시스템 측 (Java)

레거시 포털에서 HMAC-SHA256 서명을 생성하고, 서명된 URL로 iframe을 렌더링합니다.

#### HMAC 서명 유틸리티

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 챗봇 임베드용 HMAC-SHA256 서명 유틸리티.
 *
 * 정규화 문자열 형식: loginId={v}&empNo={v}&name={v}&ts={v}
 * 서명 알고리즘: HMAC-SHA256
 * 타임스탬프: epoch milliseconds (System.currentTimeMillis())
 * 서명 유효기간: 5분
 */
public class HmacUtil {

    /**
     * HMAC-SHA256 서명을 생성합니다.
     *
     * @param loginId 사용자 로그인 ID
     * @param empNo   사원번호
     * @param name    사용자 이름 (URL 인코딩 전 원본 값)
     * @param secret  공유 비밀키 (EMBED_HMAC_SECRET)
     * @return HMAC 서명 결과 (서명값 + 타임스탬프)
     */
    public static HmacResult sign(String loginId, String empNo, String name, String secret) {
        try {
            long ts = System.currentTimeMillis();

            // 정규화 문자열 생성 (name은 URL 인코딩 전 원본값 사용)
            String canonical = "loginId=" + loginId
                             + "&empNo=" + empNo
                             + "&name=" + name
                             + "&ts=" + ts;

            // HMAC-SHA256 서명
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] hash = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));

            // hex 문자열로 변환
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }

            return new HmacResult(sb.toString(), ts);

        } catch (Exception e) {
            throw new RuntimeException("HMAC 서명 생성 실패", e);
        }
    }

    /**
     * 챗봇 임베드 iframe URL을 생성합니다.
     *
     * @param chatbotHost 챗봇 호스트 (예: https://ai-chatbot.dgist.ac.kr)
     * @param appId       챗봇 앱 ID
     * @param loginId     사용자 로그인 ID
     * @param empNo       사원번호
     * @param name        사용자 이름
     * @param secret      공유 비밀키
     * @return 서명된 iframe URL
     */
    public static String buildEmbedUrl(
            String chatbotHost, String appId,
            String loginId, String empNo, String name,
            String secret) {
        try {
            HmacResult result = sign(loginId, empNo, name, secret);

            return chatbotHost + "/embed/" + appId
                 + "?loginId=" + URLEncoder.encode(loginId, "UTF-8")
                 + "&empNo=" + URLEncoder.encode(empNo, "UTF-8")
                 + "&name=" + URLEncoder.encode(name, "UTF-8")
                 + "&ts=" + result.getTimestamp()
                 + "&sig=" + result.getSignature();

        } catch (Exception e) {
            throw new RuntimeException("임베드 URL 생성 실패", e);
        }
    }

    /**
     * HMAC 서명 결과를 담는 클래스
     */
    public static class HmacResult {
        private final String signature;
        private final long timestamp;

        public HmacResult(String signature, long timestamp) {
            this.signature = signature;
            this.timestamp = timestamp;
        }

        public String getSignature() { return signature; }
        public long getTimestamp() { return timestamp; }
    }
}
```

#### Spring Controller 예제

```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import javax.servlet.http.HttpSession;

@Controller
public class ChatbotEmbedController {

    @Value("${chatbot.host}")
    private String chatbotHost;

    @Value("${chatbot.hmac-secret}")
    private String hmacSecret;

    /**
     * 인증형 임베드 챗봇 페이지를 렌더링합니다.
     */
    @GetMapping("/support/chatbot/{appId}")
    public String showEmbeddedChatbot(
            @PathVariable String appId,
            HttpSession session,
            Model model) {

        String loginId = (String) session.getAttribute("loginId");
        String empNo = (String) session.getAttribute("empNo");
        String name = (String) session.getAttribute("name");

        if (loginId == null || empNo == null || name == null) {
            return "redirect:/login";
        }

        // 서명된 임베드 URL 생성
        String embedUrl = HmacUtil.buildEmbedUrl(
            chatbotHost, appId, loginId, empNo, name, hmacSecret
        );

        model.addAttribute("embedUrl", embedUrl);
        model.addAttribute("appId", appId);
        return "chatbot-embed";
    }
}
```

**application.yml 설정**:

```yaml
chatbot:
  host: https://ai-chatbot.dgist.ac.kr
  hmac-secret: ${EMBED_HMAC_SECRET}
```

#### JSP iframe 렌더링 예제

**chatbot-embed.jsp**:

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI 상담</title>
</head>
<body>
    <div class="chatbot-wrapper" style="max-width: 800px; margin: 0 auto;">
        <h2>AI 상담</h2>
        <iframe
            id="chatbotFrame"
            src="${embedUrl}"
            width="100%"
            height="600"
            frameborder="0"
            allow="microphone"
            style="border: 1px solid #e0e0e0; border-radius: 8px;">
        </iframe>
    </div>
</body>
</html>
```

**Thymeleaf 버전** (`chatbot-embed.html`):

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>AI 상담</title>
</head>
<body>
    <div class="chatbot-wrapper" style="max-width: 800px; margin: 0 auto;">
        <h2>AI 상담</h2>
        <iframe
            id="chatbotFrame"
            th:src="${embedUrl}"
            width="100%"
            height="600"
            frameborder="0"
            allow="microphone"
            style="border: 1px solid #e0e0e0; border-radius: 8px;">
        </iframe>
    </div>
</body>
</html>
```

### 4.3 Part B: 레거시 시스템 측 - 사용자 확인 API

챗봇 시스템이 HMAC 서명을 검증한 뒤, 레거시 시스템에 사용자의 실제 존재 여부를 확인합니다. **레거시 시스템에서 이 API를 구현해야 합니다.**

#### API 명세: POST /api/verify-user

챗봇 시스템이 호출하는 API입니다. 레거시 시스템에서 구현해야 합니다.

**요청** (챗봇 시스템 -> 레거시 시스템):

```
POST /api/verify-user
Host: {LEGACY_HOST}
Content-Type: application/json
```

```json
{
  "loginId": "hong123",
  "empNo": "EMP001"
}
```

**성공 응답** (200):

```json
{
  "empNo": "EMP001",
  "loginId": "hong123",
  "name": "홍길동",
  "department": "정보통신융합전공",
  "role": "user"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `empNo` | string | O | 사원번호 |
| `loginId` | string | O | 로그인 ID |
| `name` | string | O | 사용자 이름 |
| `department` | string | X | 소속 부서 |
| `role` | string | X | 역할 (기본값: `"user"`) |

**에러 응답**:

| HTTP 상태 | 의미 |
|-----------|------|
| 404 | 해당 사용자를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

#### Spring Boot Controller 구현 예제

```java
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.HashMap;

@RestController
public class UserVerifyController {

    private final UserRepository userRepository;

    public UserVerifyController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 챗봇 시스템에서 호출하는 사용자 확인 API.
     * loginId + empNo로 사용자를 조회하여 정보를 반환합니다.
     */
    @PostMapping("/api/verify-user")
    public ResponseEntity<?> verifyUser(@RequestBody VerifyUserRequest request) {
        if (request.getLoginId() == null || request.getEmpNo() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "loginId and empNo are required"));
        }

        // DB에서 사용자 조회
        User user = userRepository.findByLoginIdAndEmpNo(
            request.getLoginId(),
            request.getEmpNo()
        );

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "User not found"));
        }

        // 사용자 정보 반환
        Map<String, String> response = new HashMap<>();
        response.put("empNo", user.getEmpNo());
        response.put("loginId", user.getLoginId());
        response.put("name", user.getName());
        response.put("department", user.getDepartment());
        response.put("role", user.getRole() != null ? user.getRole() : "user");

        return ResponseEntity.ok(response);
    }
}

// 요청 DTO
public class VerifyUserRequest {
    private String loginId;
    private String empNo;

    public String getLoginId() { return loginId; }
    public void setLoginId(String loginId) { this.loginId = loginId; }
    public String getEmpNo() { return empNo; }
    public void setEmpNo(String empNo) { this.empNo = empNo; }
}
```

#### 챗봇 시스템 환경변수 설정

시나리오 3이 동작하려면 챗봇 시스템의 `.env.local`에 다음 환경변수가 필요합니다:

```bash
# 레거시 사용자 확인 API URL (레거시 시스템에서 구현한 엔드포인트)
LEGACY_VERIFY_API_URL=https://portal.dgist.ac.kr/api/verify-user

# HMAC 공유 비밀키 (레거시 시스템과 동일한 값)
EMBED_HMAC_SECRET=your-shared-hmac-secret-key
```

---

## 5. 공통 정보

### 5.1 API 엔드포인트 요약

| 엔드포인트 | 메서드 | 시나리오 | 호출 주체 | 설명 |
|-----------|--------|---------|----------|------|
| `/api/auth/embed-token` | POST | 1 | 레거시 서버 | JWT 토큰 발급 (API Key 인증) |
| `/api/auth/token` | POST | 1 | 사용자 브라우저 | JWT 토큰 검증 + 쿠키 설정 + 리다이렉트 |
| `/simple-chat/{appId}` | GET | 2 | 사용자 브라우저 | 익명 임베드 챗봇 페이지 |
| `/embed/{appId}` | GET | 3 | 사용자 브라우저 | 인증형 임베드 챗봇 페이지 |
| `/api/auth/embed-verify` | POST | 3 | 챗봇 시스템 (내부) | HMAC 검증 + 사용자 확인 + JWT 발급 |
| `/api/verify-user` | POST | 3 | 챗봇 시스템 | 사용자 존재 확인 (**레거시에서 구현**) |

### 5.2 환경변수

양 시스템 간에 공유해야 하는 환경변수입니다. 반드시 안전한 채널로 전달하세요.

| 환경변수 | 시나리오 | 설정 위치 | 설명 |
|---------|---------|----------|------|
| `EMBED_API_KEY` | 1 | 챗봇 + 레거시 | embed-token API 인증용 키 |
| `EMBED_HMAC_SECRET` | 3 | 챗봇 + 레거시 | HMAC-SHA256 서명용 공유 비밀키 |
| `JWT_EXPIRY_HOURS` | 1, 3 | 챗봇 | JWT 토큰 유효기간 (기본값: `8`시간) |
| `LEGACY_VERIFY_API_URL` | 3 | 챗봇 | 레거시 사용자 확인 API URL |

**키 생성 예제**:

```bash
# EMBED_API_KEY (랜덤 문자열)
openssl rand -base64 32

# EMBED_HMAC_SECRET (랜덤 문자열)
openssl rand -base64 32
```

### 5.3 에러 코드 매핑

#### 시나리오 1: embed-token API 에러

| HTTP 상태 | 에러 메시지 | 원인 | 레거시 측 대응 |
|-----------|-----------|------|--------------|
| 503 | `Embed token endpoint is not configured` | 챗봇 서버에 `EMBED_API_KEY` 미설정 | 챗봇 운영자에게 문의 |
| 401 | `Unauthorized` | `X-API-Key` 헤더 값 불일치 | API Key 확인 |
| 400 | `loginId, empNo, name are required` | 필수 필드 누락 | 요청 본문 확인 |
| 500 | `Internal server error` | 챗봇 서버 내부 오류 | 챗봇 운영자에게 문의 |

#### 시나리오 3: embed-verify API 에러

| HTTP 상태 | 에러 메시지 | 원인 | 레거시 측 대응 |
|-----------|-----------|------|--------------|
| 400 | `loginId, empNo, name, ts, sig are required` | 파라미터 누락 | URL 파라미터 확인 |
| 401 | `Timestamp expired` | 서명 생성 후 5분 초과 | 서버 시간 동기화 확인 |
| 401 | `Invalid signature` | HMAC 서명 불일치 | HMAC SECRET 확인 |
| 401 | `User verification failed` | 레거시 사용자 확인 실패 | verify-user API 확인 |
| 500 | `Internal server error` | 챗봇 서버 내부 오류 | 챗봇 운영자에게 문의 |

### 5.4 curl 테스트 예제

#### 시나리오 1: embed-token 발급 테스트

```bash
# 토큰 발급 요청
curl -X POST https://ai-chatbot.dgist.ac.kr/api/auth/embed-token \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-embed-api-key" \
  -d '{
    "loginId": "hong123",
    "empNo": "EMP001",
    "name": "홍길동",
    "role": "user"
  }'

# 예상 응답:
# {"success":true,"token":"eyJhbG...","expiresIn":28800}
```

#### 시나리오 1: token 검증 테스트 (Form POST)

```bash
# Form POST로 토큰 전달 (리다이렉트 확인)
curl -X POST https://ai-chatbot.dgist.ac.kr/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbG..." \
  -v

# 예상 응답:
# HTTP/1.1 302 Found
# Location: /
# Set-Cookie: auth_token=eyJ...; HttpOnly; Secure; ...
```

#### 시나리오 3: embed-verify 테스트

```bash
# HMAC 서명 생성 (Linux/Mac)
SECRET="your-hmac-secret"
LOGIN_ID="hong123"
EMP_NO="EMP001"
NAME="홍길동"
TS=$(date +%s%3N)  # epoch milliseconds
CANONICAL="loginId=${LOGIN_ID}&empNo=${EMP_NO}&name=${NAME}&ts=${TS}"
SIG=$(echo -n "$CANONICAL" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

echo "Canonical: $CANONICAL"
echo "Signature: $SIG"
echo "Timestamp: $TS"

# embed-verify API 호출
curl -X POST https://ai-chatbot.dgist.ac.kr/api/auth/embed-verify \
  -H "Content-Type: application/json" \
  -d "{
    \"loginId\": \"${LOGIN_ID}\",
    \"empNo\": \"${EMP_NO}\",
    \"name\": \"${NAME}\",
    \"ts\": \"${TS}\",
    \"sig\": \"${SIG}\"
  }"

# 예상 응답:
# {"success":true,"user":{"empNo":"EMP001","loginId":"hong123","name":"홍길동","role":"user"}}
```

#### 시나리오 3: 레거시 사용자 확인 API 테스트

```bash
# 레거시 시스템의 verify-user API 테스트
curl -X POST https://portal.dgist.ac.kr/api/verify-user \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "hong123",
    "empNo": "EMP001"
  }'

# 예상 응답:
# {"empNo":"EMP001","loginId":"hong123","name":"홍길동","department":"정보통신융합전공","role":"user"}
```

### 5.5 보안 주의사항

#### 필수 사항

1. **HTTPS 사용 (프로덕션 필수)**
   - 모든 API 통신은 HTTPS로 수행해야 합니다.
   - HTTP 환경에서는 토큰 탈취 위험이 있습니다.

2. **비밀키 안전 관리**
   - `EMBED_API_KEY`와 `EMBED_HMAC_SECRET`은 소스코드에 하드코딩하지 마세요.
   - 환경변수 또는 보안 저장소(Vault 등)를 사용하세요.
   - 키가 유출된 경우 즉시 양쪽 시스템에서 키를 갱신하세요.

3. **서버 시간 동기화**
   - 시나리오 3의 HMAC 서명은 5분 유효기간이 있습니다.
   - 레거시 서버와 챗봇 서버의 시간 차이가 5분 이내여야 합니다.
   - NTP(Network Time Protocol)로 시간을 동기화하세요.

4. **입력값 검증**
   - `loginId`, `empNo` 등 사용자 입력값은 서버 측에서 반드시 검증하세요.
   - XSS 방지를 위해 HTML/JavaScript 특수문자를 이스케이프하세요.

#### 권장 사항

5. **토큰 유효기간 조정**
   - 기본 8시간이며, `JWT_EXPIRY_HOURS` 환경변수로 조정 가능합니다.
   - 보안이 중요한 환경에서는 1~2시간으로 줄이는 것을 권장합니다.

6. **에러 로깅**
   - 토큰 발급 실패, HMAC 검증 실패 등의 이벤트를 레거시 시스템에서 로깅하세요.
   - 비정상적인 실패 패턴이 감지되면 알림을 설정하세요.

7. **네트워크 접근 제어**
   - 가능하면 `embed-token` API는 레거시 서버 IP에서만 접근 가능하도록 방화벽을 설정하세요.
   - `verify-user` API는 챗봇 서버 IP에서만 접근 가능하도록 설정하세요.

---

## 부록: 연동 체크리스트

### 시나리오 1 체크리스트

- [ ] 챗봇 운영자에게 `EMBED_API_KEY` 값 전달받기
- [ ] 레거시 서버에 `EMBED_API_KEY` 환경변수 설정
- [ ] `ChatbotTokenService` (또는 동등한 코드) 구현
- [ ] JSP/Thymeleaf 자동 제출 폼 페이지 작성
- [ ] 레거시 포털에 "AI 챗봇" 메뉴/링크 추가
- [ ] 개발 환경에서 토큰 발급 및 리다이렉트 테스트
- [ ] 프로덕션 환경에서 HTTPS 통신 확인

### 시나리오 2 체크리스트

- [ ] 챗봇 운영자에게 `appId` 확인
- [ ] 해당 챗봇의 공개/익명 설정 확인 (`allowAnonymous=true`)
- [ ] iframe 태그 추가
- [ ] iframe 크기 및 스타일 조정

### 시나리오 3 체크리스트

- [ ] 챗봇 운영자와 `EMBED_HMAC_SECRET` 값 합의 및 공유
- [ ] 레거시 서버에 `EMBED_HMAC_SECRET` 환경변수 설정
- [ ] `HmacUtil` 클래스 구현 및 단위 테스트
- [ ] `/api/verify-user` API 구현 및 테스트
- [ ] 챗봇 운영자에게 `LEGACY_VERIFY_API_URL` 전달
- [ ] iframe 렌더링 페이지 작성
- [ ] 개발 환경에서 전체 흐름 테스트
- [ ] 서버 시간 동기화 확인 (NTP)
- [ ] 프로덕션 환경에서 HTTPS 통신 확인
