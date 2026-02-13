# DGIST AI 포털 - 레거시 시스템 연동 가이드

> **대상 독자**: Java/Spring 기반 레거시 시스템 개발자
> **최종 수정**: 2026-02-12
> **버전**: 1.1

---

## 목차

1. [개요](#1-개요)
2. [시나리오 1: AI 포털 접속 (Legacy Portal -> Chatbot)](#2-시나리오-1-ai-포털-접속)
   - [2.1 흐름도](#21-흐름도)
   - [2.2 API 명세: POST /api/auth/embed-token](#22-api-명세-post-apiauthembed-token)
   - [2.3 API 명세: /api/auth/token](#23-api-명세-apiauthtoken)
   - [2.4 Java 구현 예제 (서비스)](#24-java-구현-예제-서비스)
   - [2.5 Java 구현 예제 (컨트롤러)](#25-java-구현-예제-컨트롤러)
   - [2.6 JavaScript 호출 예제](#26-javascript-호출-예제)
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
| **시나리오 1** | 포털에서 AI 챗봇 페이지로 이동 | API Key + JWT | 서버 측 토큰 발급 + 302 리다이렉트 |
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
     |<-- 302 Redirect ------|                        |
     |    Location: /api/auth/token?token=eyJ...      |
     |                       |                        |
     |-- GET /api/auth/token?token=eyJ... ----------->|
     |<-- 302 Redirect + Set-Cookie(auth_token) ------|
     |    Location: /                                 |
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

### 2.3 API 명세: /api/auth/token

브라우저가 JWT 토큰을 제출하면, 챗봇 시스템이 쿠키를 설정하고 메인 페이지로 리다이렉트합니다.

**3가지 전달 방식 지원** (레거시 시스템 구현 편의에 따라 선택):

#### 방법 A: GET 리다이렉트 (가장 간단, 권장)

레거시 서버에서 사용자의 브라우저를 302 리다이렉트합니다.

```
GET /api/auth/token?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Host: {CHATBOT_HOST}
```

레거시 서버 구현이 가장 간단합니다. 컨트롤러에서 `redirect:` 한 줄이면 됩니다.

#### 방법 B: Form POST (auto-submit form)

HTML 페이지에서 자동 제출 폼으로 토큰을 전달합니다.

```
POST /api/auth/token
Host: {CHATBOT_HOST}
Content-Type: application/x-www-form-urlencoded

token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

보안상 URL에 토큰을 노출하지 않으므로 더 안전합니다.

#### 방법 C: 포털 URL 파라미터

포털 메인 페이지에 토큰을 쿼리 파라미터로 전달합니다. 포털 페이지의 JavaScript가 자동으로 처리합니다.

```
GET /?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Host: {CHATBOT_HOST}
```

**공통 성공 응답**: HTTP 302 리다이렉트

```
HTTP/1.1 302 Found
Location: /
Set-Cookie: auth_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Max-Age=28800; Path=/
```

**공통 실패 응답**: HTTP 302 리다이렉트 (에러 페이지로)

```
HTTP/1.1 302 Found
Location: /login?error=invalid_token
```

| 에러 파라미터 | 원인 |
|-------------|------|
| `missing_token` | 토큰 파라미터 없음 |
| `invalid_token` | JWT 검증 실패 (만료, 서명 불일치 등) |
| `server_error` | 서버 내부 오류 |

### 2.4 Java 구현 예제 (서비스)

챗봇 시스템에 토큰을 요청하는 서비스 클래스입니다.

**properties 설정**:

```properties
chatbot.protocol=http
chatbot.host=10.110.2.18
chatbot.port=3000
chatbot.embedApiKey=your-embed-api-key-here
chatbot.getTokenUrl=/api/auth/embed-token
chatbot.indexUrl=/api/auth/token
```

**서비스 구현** (HttpURLConnection):

```java
@Service
public class ChatbotServiceImpl implements ChatbotService {

    /**
     * 챗봇 시스템에 JWT 토큰을 요청하고, 리다이렉트 URL을 반환합니다.
     */
    @Override
    public Map<String, Object> getChatbotToken(HttpServletRequest request) throws Exception {
        // 세션에서 사용자 정보 조회
        String loginId = (String) request.getSession().getAttribute("LOGIN_ID");
        String empNo = (String) request.getSession().getAttribute("STTS_NO");
        String name = (String) request.getSession().getAttribute("KOR_REL_PSN_NM");

        // JSON 요청 본문 생성
        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("loginId", loginId);
        paramMap.put("empNo", empNo);
        paramMap.put("name", name);
        paramMap.put("role", "user");

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonBody = objectMapper.writeValueAsString(paramMap);

        // 설정값 로드
        String chatbotBaseUrl = chatbotProtocol + "://" + chatbotHost + ":" + chatbotPort;
        String EMBED_API_KEY = chatbotEmbedApiKey;

        Map<String, Object> resultMap = new HashMap<>();
        HttpURLConnection conn = null;

        try {
            URL url = new URL(chatbotBaseUrl + chatbotGetTokenUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-API-Key", EMBED_API_KEY);
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();

            if (responseCode == 200) {
                // 성공 응답 파싱
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line);
                    }

                    JsonObject obj = JsonParser.parseString(sb.toString()).getAsJsonObject();
                    String tokenInfo = obj.get("token").getAsString();

                    resultMap.put("result", true);
                    resultMap.put("tokenInfo", tokenInfo);
                    // 리다이렉트 URL에 토큰 포함
                    resultMap.put("chatbotRedirect",
                        chatbotBaseUrl + chatbotIndexUrl + "?token=" + tokenInfo);
                }
            } else {
                // 에러 처리
                resultMap.put("result", false);
                resultMap.put("message", "토큰 발급 실패 (HTTP " + responseCode + ")");
            }
        } catch (Exception e) {
            resultMap.put("result", false);
            resultMap.put("message", "챗봇 토큰 요청 중 오류: " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }

        return resultMap;
    }
}
```

### 2.5 Java 구현 예제 (컨트롤러)

**방법 A: GET 리다이렉트 (권장)**

컨트롤러에서 토큰 발급 후 바로 챗봇으로 리다이렉트합니다. JSP 페이지가 필요 없습니다.

```java
@Controller
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @RequestMapping(value = "/com/chatbot/index.do")
    public String index(HttpServletRequest request, ModelMap model) throws Exception {
        Map<String, Object> tokenMap = chatbotService.getChatbotToken(request);

        // 토큰 발급 성공 → 챗봇으로 바로 리다이렉트
        if (Boolean.TRUE.equals(tokenMap.get("result"))) {
            return "redirect:" + tokenMap.get("chatbotRedirect");
        }

        // 실패 시 에러 페이지 표시
        model.addAttribute("tokenMap", tokenMap);
        return "com/compChatbotError";
    }
}
```

Spring MVC의 `redirect:` 접두사는 외부 URL도 지원합니다. 최종 리다이렉트 URL:

```
http://{CHATBOT_HOST}/api/auth/token?token=eyJhbG...
```

### 2.6 JavaScript 호출 예제

레거시 포털에서 챗봇을 새 창으로 여는 JavaScript 코드입니다.

**새 탭으로 열기**:

```javascript
$("#btnChatBot").click(function() {
    window.open('<c:url value="/com/chatbot/index.do" />', '_blank');
});
```

**팝업 창으로 열기**:

```javascript
$("#btnChatBot").click(function() {
    window.open(
        '<c:url value="/com/chatbot/index.do" />',
        'chatbotWindow',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
});
```

### 2.7 대안: Form POST 방식 (JSP 사용)

URL에 토큰을 노출하지 않으려면, JSP에서 auto-submit form을 사용할 수 있습니다.

**chatbot-redirect.jsp**:

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI 챗봇으로 이동 중...</title>
</head>
<body>
    <p>AI 챗봇으로 이동 중입니다...</p>

    <form id="chatbotForm"
          method="POST"
          action="${chatbotHost}/api/auth/token"
          style="display: none;">
        <input type="hidden" name="token" value="${token}" />
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('chatbotForm').submit();
        });
    </script>
</body>
</html>
```

이 방식을 사용하려면 컨트롤러에서 `redirect:` 대신 JSP 뷰를 반환합니다:

```java
// Form POST 방식 (JSP 사용)
model.addAttribute("chatbotHost", chatbotBaseUrl);
model.addAttribute("token", tokenMap.get("tokenInfo"));
return "chatbot-redirect";
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

    public static HmacResult sign(String loginId, String empNo, String name, String secret) {
        try {
            long ts = System.currentTimeMillis();

            String canonical = "loginId=" + loginId
                             + "&empNo=" + empNo
                             + "&name=" + name
                             + "&ts=" + ts;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] hash = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }

            return new HmacResult(sb.toString(), ts);

        } catch (Exception e) {
            throw new RuntimeException("HMAC 서명 생성 실패", e);
        }
    }

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
@Controller
public class ChatbotEmbedController {

    @Value("${chatbot.host}")
    private String chatbotHost;

    @Value("${chatbot.hmac-secret}")
    private String hmacSecret;

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

        String embedUrl = HmacUtil.buildEmbedUrl(
            chatbotHost, appId, loginId, empNo, name, hmacSecret
        );

        model.addAttribute("embedUrl", embedUrl);
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

### 4.3 Part B: 레거시 시스템 측 - 사용자 확인 API

챗봇 시스템이 HMAC 서명을 검증한 뒤, 레거시 시스템에 사용자의 실제 존재 여부를 확인합니다. **레거시 시스템에서 이 API를 구현해야 합니다.**

#### API 명세: POST /api/verify-user

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
@RestController
public class UserVerifyController {

    private final UserRepository userRepository;

    public UserVerifyController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/api/verify-user")
    public ResponseEntity<?> verifyUser(@RequestBody VerifyUserRequest request) {
        if (request.getLoginId() == null || request.getEmpNo() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "loginId and empNo are required"));
        }

        User user = userRepository.findByLoginIdAndEmpNo(
            request.getLoginId(),
            request.getEmpNo()
        );

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "User not found"));
        }

        Map<String, String> response = new HashMap<>();
        response.put("empNo", user.getEmpNo());
        response.put("loginId", user.getLoginId());
        response.put("name", user.getName());
        response.put("department", user.getDepartment());
        response.put("role", user.getRole() != null ? user.getRole() : "user");

        return ResponseEntity.ok(response);
    }
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
| `/api/auth/token` | GET | 1 | 사용자 브라우저 | JWT 토큰 검증 + 쿠키 설정 + 리다이렉트 (권장) |
| `/api/auth/token` | POST | 1 | 사용자 브라우저 | JWT 토큰 검증 + 쿠키 설정 + 리다이렉트 (Form POST) |
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

#### 시나리오 1: token 검증 테스트

```bash
# 방법 A: GET 리다이렉트 (권장)
curl -v "https://ai-chatbot.dgist.ac.kr/api/auth/token?token=eyJhbG..."

# 방법 B: Form POST
curl -X POST https://ai-chatbot.dgist.ac.kr/api/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbG..." \
  -v

# 예상 응답 (공통):
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
- [ ] 레거시 서버에 `EMBED_API_KEY` 설정 (properties 또는 환경변수)
- [ ] 챗봇 호스트 URL 설정 (프로토콜, 호스트, 포트)
- [ ] 토큰 발급 서비스 구현 (`POST /api/auth/embed-token` 호출)
- [ ] 컨트롤러 구현 (`redirect:` 방식 또는 JSP auto-submit 방식)
- [ ] 레거시 포털에 "AI 챗봇" 메뉴/링크 추가 (`window.open` 또는 팝업)
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
