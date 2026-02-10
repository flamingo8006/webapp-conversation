/**
 * 레거시 포털 시뮬레이션 서버
 *
 * 시나리오 1: AI 포털 접속 (embed-token → form POST → 리다이렉트)
 * 시나리오 3: 인증형 임베드 (HMAC 서명 → iframe)
 * 시나리오 3 부속: 사용자 확인 API (/api/verify-user)
 *
 * 사용법: npx ts-node scripts/mock-legacy-server.ts
 * 접속: http://localhost:4000
 */

import * as http from 'http'
import { createHmac } from 'crypto'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { URL } from 'url'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const PORT = 4000
const CHATBOT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const EMBED_API_KEY = process.env.EMBED_API_KEY || 'dev-test-api-key-change-in-production'
const HMAC_SECRET = process.env.EMBED_HMAC_SECRET || 'dev-test-hmac-secret-change-in-production'

// 테스트 사용자 목록
const USERS = [
  { loginId: 'hong', empNo: '20210001', name: '홍길동', department: '전산팀', role: 'user' },
  { loginId: 'kim', empNo: '20210002', name: '김철수', department: '연구팀', role: 'user' },
  { loginId: 'lee', empNo: '20210003', name: '이영희', department: '기획팀', role: 'user' },
]

// 앱 ID (포털에서 공개 앱 목록을 가져올 수도 있음)
let cachedApps: Array<{ id: string, name: string, nameKo: string }> = []

async function fetchPublicApps() {
  try {
    const res = await fetch(`${CHATBOT_URL}/api/apps/public`)
    if (res.ok) {
      cachedApps = await res.json() as typeof cachedApps
    }
  }
  catch {
    console.log('⚠ 챗봇 서버에서 앱 목록을 가져올 수 없습니다. 수동으로 appId를 입력하세요.')
  }
}

// HMAC 서명 생성
function generateHmac(loginId: string, empNo: string, name: string) {
  const ts = String(Date.now())
  const canonical = `loginId=${loginId}&empNo=${empNo}&name=${name}&ts=${ts}`
  const sig = createHmac('sha256', HMAC_SECRET).update(canonical).digest('hex')
  return { ts, sig }
}

// embed-token API 호출 (시나리오 1)
async function callEmbedTokenApi(user: typeof USERS[0]): Promise<string | null> {
  try {
    const res = await fetch(`${CHATBOT_URL}/api/auth/embed-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EMBED_API_KEY,
      },
      body: JSON.stringify({
        loginId: user.loginId,
        empNo: user.empNo,
        name: user.name,
        role: user.role,
      }),
    })

    if (!res.ok) {
      const error = await res.json() as { error: string }
      console.error(`embed-token API 에러 (${res.status}):`, error)
      return null
    }

    const data = await res.json() as { token: string }
    return data.token
  }
  catch (err) {
    console.error('embed-token API 호출 실패:', err)
    return null
  }
}

// HTML 페이지 렌더링
function renderMainPage() {
  const userOptions = USERS.map(u =>
    `<option value="${u.loginId}">${u.name} (${u.loginId} / ${u.empNo})</option>`,
  ).join('\n')

  const appOptions = cachedApps.length > 0
    ? cachedApps.map(a => `<option value="${a.id}">${a.nameKo || a.name}</option>`).join('\n')
    : '<option value="">앱 목록을 불러올 수 없습니다 (직접 입력)</option>'

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>레거시 포털 시뮬레이터</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; }
    .header { background: #1a365d; color: white; padding: 16px 24px; display: flex; align-items: center; gap: 16px; }
    .header h1 { font-size: 20px; font-weight: 600; }
    .header .badge { background: #e53e3e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .container { max-width: 900px; margin: 32px auto; padding: 0 16px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h2 { font-size: 18px; margin-bottom: 16px; color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .card h3 { font-size: 15px; margin: 16px 0 8px; color: #4a5568; }
    .field { margin-bottom: 12px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: #4a5568; margin-bottom: 4px; }
    .field select, .field input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
    .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #3182ce; color: white; }
    .btn-primary:hover { background: #2c5282; }
    .btn-green { background: #38a169; color: white; }
    .btn-green:hover { background: #2f855a; }
    .btn-red { background: #e53e3e; color: white; }
    .btn-red:hover { background: #c53030; }
    .result { margin-top: 12px; padding: 12px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; display: none; }
    .desc { font-size: 13px; color: #718096; margin-bottom: 12px; line-height: 1.6; }
    .flow { background: #edf2f7; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; margin-bottom: 12px; white-space: pre; overflow-x: auto; }
    .iframe-container { border: 2px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 12px; }
    .iframe-container iframe { width: 100%; height: 500px; border: none; }
    .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .tag-s1 { background: #bee3f8; color: #2a69ac; }
    .tag-s3 { background: #c6f6d5; color: #276749; }
    .flex { display: flex; gap: 12px; align-items: flex-end; }
    .flex .field { flex: 1; }
  </style>
</head>
<body>
  <div class="header">
    <h1>DGIST 레거시 포털</h1>
    <span class="badge">시뮬레이터</span>
  </div>

  <div class="container">

    <!-- 시나리오 1 -->
    <div class="card">
      <h2><span class="tag tag-s1">시나리오 1</span> AI 포털 접속</h2>
      <p class="desc">
        레거시 포털에서 "AI 챗봇" 메뉴를 클릭하면, 서버가 <code>embed-token</code> API로 JWT를 발급받고,
        자동 제출 폼으로 챗봇 시스템에 토큰을 전달합니다.
      </p>
      <div class="flow">사용자 클릭 → 레거시 서버 → POST /api/auth/embed-token → JWT 발급
→ auto-submit form → POST /api/auth/token → 쿠키 설정 → 302 / 리다이렉트</div>

      <div class="field">
        <label>사용자 선택</label>
        <select id="s1-user">
          ${userOptions}
        </select>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" onclick="testScenario1(false)">
          🚀 AI 포털로 이동 (새 탭)
        </button>
        <button class="btn btn-green" onclick="testScenario1(true)">
          🔍 토큰만 발급 (결과 확인)
        </button>
      </div>
      <div id="s1-result" class="result"></div>
    </div>

    <!-- 시나리오 3 -->
    <div class="card">
      <h2><span class="tag tag-s3">시나리오 3</span> 인증형 임베드 (HMAC)</h2>
      <p class="desc">
        임베딩 시스템이 HMAC-SHA256 서명된 URL을 생성하고 iframe으로 챗봇을 삽입합니다.
        챗봇은 서명을 검증하고 레거시 시스템에 사용자 확인을 요청합니다.
      </p>
      <div class="flow">iframe 로드 → embed 페이지 → POST /api/auth/embed-verify (HMAC 검증)
→ POST /api/verify-user (레거시에 사용자 확인) → JWT 발급 → 채팅</div>

      <div class="flex">
        <div class="field">
          <label>사용자 선택</label>
          <select id="s3-user">
            ${userOptions}
          </select>
        </div>
        <div class="field">
          <label>챗봇 선택</label>
          <select id="s3-app">
            ${appOptions}
          </select>
        </div>
      </div>
      <div class="field">
        <label>또는 앱 ID 직접 입력</label>
        <input type="text" id="s3-appId" placeholder="cmla7guun000xjcv9uxe6j0cq" />
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
        <button class="btn btn-green" onclick="testScenario3Embed()">
          📺 iframe으로 임베드
        </button>
        <button class="btn btn-primary" onclick="testScenario3Url()">
          🔗 URL만 생성
        </button>
        <button class="btn btn-red" onclick="testScenario3Expired()">
          ⏰ 만료된 URL 테스트
        </button>
      </div>
      <div id="s3-result" class="result"></div>
      <div id="s3-iframe" class="iframe-container" style="display:none;"></div>
    </div>

    <!-- 사용자 확인 API 로그 -->
    <div class="card">
      <h2>📋 사용자 확인 API 로그 (POST /api/verify-user)</h2>
      <p class="desc">
        챗봇 시스템이 HMAC 검증 후 이 서버의 <code>/api/verify-user</code>를 호출합니다.
        아래에 요청/응답 로그가 표시됩니다.
      </p>
      <div id="verify-log" style="font-family: monospace; font-size: 12px; background: #1a202c; color: #a0aec0; padding: 16px; border-radius: 8px; min-height: 60px; max-height: 300px; overflow-y: auto;">
        대기 중...
      </div>
      <button class="btn btn-red" onclick="document.getElementById('verify-log').innerHTML='대기 중...'" style="margin-top: 8px;">로그 지우기</button>
    </div>

    <!-- 설정 정보 -->
    <div class="card">
      <h2>⚙️ 현재 설정</h2>
      <table style="width:100%; font-size: 13px; border-collapse: collapse;">
        <tr><td style="padding: 6px; font-weight: 600;">챗봇 서버</td><td style="padding: 6px;">${CHATBOT_URL}</td></tr>
        <tr style="background:#f7fafc;"><td style="padding: 6px; font-weight: 600;">EMBED_API_KEY</td><td style="padding: 6px;">${EMBED_API_KEY.slice(0, 10)}...${EMBED_API_KEY.slice(-5)}</td></tr>
        <tr><td style="padding: 6px; font-weight: 600;">EMBED_HMAC_SECRET</td><td style="padding: 6px;">${HMAC_SECRET.slice(0, 10)}...${HMAC_SECRET.slice(-5)}</td></tr>
        <tr style="background:#f7fafc;"><td style="padding: 6px; font-weight: 600;">레거시 서버</td><td style="padding: 6px;">http://localhost:${PORT}</td></tr>
        <tr><td style="padding: 6px; font-weight: 600;">사용자 확인 API</td><td style="padding: 6px;">http://localhost:${PORT}/api/verify-user</td></tr>
      </table>
    </div>
  </div>

  <script>
    // 시나리오 1: AI 포털 접속
    async function testScenario1(tokenOnly) {
      const resultEl = document.getElementById('s1-result');
      const loginId = document.getElementById('s1-user').value;
      resultEl.style.display = 'block';
      resultEl.textContent = '토큰 발급 중...';

      try {
        const res = await fetch('/scenario1/get-token?loginId=' + loginId);
        const data = await res.json();

        if (!data.success) {
          resultEl.textContent = '❌ 에러: ' + data.error;
          return;
        }

        if (tokenOnly) {
          resultEl.textContent = '✅ JWT 토큰 발급 성공\\n\\n'
            + 'Token (앞 80자): ' + data.token.slice(0, 80) + '...\\n'
            + 'ExpiresIn: ' + data.expiresIn + '초 (' + (data.expiresIn/3600) + '시간)\\n\\n'
            + 'Form POST URL: ${CHATBOT_URL}/api/auth/token\\n'
            + 'Content-Type: application/x-www-form-urlencoded\\n'
            + 'Body: token={JWT}';
          return;
        }

        // 자동 제출 폼을 새 탭에서 렌더링
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '${CHATBOT_URL}/api/auth/token';
        form.target = '_blank';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token';
        input.value = data.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        resultEl.textContent = '✅ 새 탭에서 챗봇 포털로 이동했습니다.';
      } catch (err) {
        resultEl.textContent = '❌ 에러: ' + err.message;
      }
    }

    // 시나리오 3: HMAC URL 생성
    function getS3AppId() {
      const manual = document.getElementById('s3-appId').value.trim();
      if (manual) return manual;
      return document.getElementById('s3-app').value;
    }

    async function testScenario3Url() {
      const resultEl = document.getElementById('s3-result');
      const loginId = document.getElementById('s3-user').value;
      const appId = getS3AppId();
      if (!appId) { resultEl.style.display = 'block'; resultEl.textContent = '앱 ID를 입력하세요'; return; }

      resultEl.style.display = 'block';
      resultEl.textContent = 'HMAC URL 생성 중...';

      try {
        const res = await fetch('/scenario3/generate-url?loginId=' + loginId + '&appId=' + appId);
        const data = await res.json();
        resultEl.textContent = '✅ HMAC 서명 URL 생성 완료\\n\\n'
          + 'URL: ' + data.url + '\\n\\n'
          + 'Canonical: ' + data.canonical + '\\n'
          + 'Signature: ' + data.sig + '\\n'
          + 'Timestamp: ' + data.ts + ' (' + new Date(parseInt(data.ts)).toLocaleString() + ')\\n'
          + '유효기간: 5분';
      } catch (err) {
        resultEl.textContent = '❌ 에러: ' + err.message;
      }
    }

    async function testScenario3Embed() {
      const loginId = document.getElementById('s3-user').value;
      const appId = getS3AppId();
      if (!appId) { alert('앱 ID를 입력하세요'); return; }

      const res = await fetch('/scenario3/generate-url?loginId=' + loginId + '&appId=' + appId);
      const data = await res.json();

      const iframeContainer = document.getElementById('s3-iframe');
      iframeContainer.style.display = 'block';
      iframeContainer.innerHTML = '<iframe src="' + data.url + '"></iframe>';

      const resultEl = document.getElementById('s3-result');
      resultEl.style.display = 'block';
      resultEl.textContent = '✅ iframe 로드됨 (아래 참조)\\nURL: ' + data.url;
    }

    async function testScenario3Expired() {
      const resultEl = document.getElementById('s3-result');
      const loginId = document.getElementById('s3-user').value;
      const appId = getS3AppId();
      if (!appId) { resultEl.style.display = 'block'; resultEl.textContent = '앱 ID를 입력하세요'; return; }

      const res = await fetch('/scenario3/generate-url?loginId=' + loginId + '&appId=' + appId + '&expired=true');
      const data = await res.json();

      const iframeContainer = document.getElementById('s3-iframe');
      iframeContainer.style.display = 'block';
      iframeContainer.innerHTML = '<iframe src="' + data.url + '"></iframe>';

      resultEl.style.display = 'block';
      resultEl.textContent = '⏰ 만료된 URL 테스트\\n서명 시점: ' + new Date(parseInt(data.ts)).toLocaleString() + ' (10분 전)\\n→ iframe에서 인증 실패 메시지가 표시되어야 합니다.';
    }

    // 사용자 확인 API 로그 폴링
    setInterval(async () => {
      try {
        const res = await fetch('/api/verify-log');
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          document.getElementById('verify-log').innerHTML = data.logs.join('<br>');
        }
      } catch {}
    }, 2000);
  </script>
</body>
</html>`
}

// 자동 제출 폼 HTML (시나리오 1 - 실제 JSP가 렌더링하는 것과 동일)
function renderAutoSubmitForm(token: string) {
  return `<!DOCTYPE html>
<html>
<head><title>AI 포털로 이동 중...</title></head>
<body>
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
    <div style="text-align:center;">
      <div style="border:4px solid #e2e8f0;border-top:4px solid #3182ce;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto;"></div>
      <p style="margin-top:16px;color:#718096;">AI 포털로 이동 중...</p>
    </div>
  </div>
  <form id="tokenForm" method="POST" action="${CHATBOT_URL}/api/auth/token">
    <input type="hidden" name="token" value="${token}" />
  </form>
  <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  <script>document.getElementById('tokenForm').submit();</script>
  <noscript>
    <p style="text-align:center;margin-top:20px;">JavaScript가 비활성화되어 있습니다. 아래 버튼을 클릭하세요:</p>
    <form method="POST" action="${CHATBOT_URL}/api/auth/token" style="text-align:center;">
      <input type="hidden" name="token" value="${token}" />
      <button type="submit" style="padding:10px 20px;font-size:16px;">AI 포털로 이동</button>
    </form>
  </noscript>
</body>
</html>`
}

// 사용자 확인 API 로그
const verifyLogs: string[] = []

// HTTP 서버
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = url.pathname

  // CORS (iframe에서 호출 가능하도록)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 메인 페이지
  if (pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderMainPage())
    return
  }

  // 시나리오 1: 토큰 발급
  if (pathname === '/scenario1/get-token' && req.method === 'GET') {
    const loginId = url.searchParams.get('loginId') || 'hong'
    const user = USERS.find(u => u.loginId === loginId) || USERS[0]

    const token = await callEmbedTokenApi(user)
    if (!token) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'Failed to get token from chatbot API' }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, token, expiresIn: 28800 }))
    return
  }

  // 시나리오 1: 자동 제출 폼 (실제 브라우저 리다이렉트 테스트용)
  if (pathname === '/scenario1/redirect' && req.method === 'GET') {
    const loginId = url.searchParams.get('loginId') || 'hong'
    const user = USERS.find(u => u.loginId === loginId) || USERS[0]

    const token = await callEmbedTokenApi(user)
    if (!token) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<html><body><h1>토큰 발급 실패</h1><p>챗봇 서버에 연결할 수 없습니다.</p></body></html>')
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(renderAutoSubmitForm(token))
    return
  }

  // 시나리오 3: HMAC URL 생성
  if (pathname === '/scenario3/generate-url' && req.method === 'GET') {
    const loginId = url.searchParams.get('loginId') || 'hong'
    const appId = url.searchParams.get('appId') || ''
    const expired = url.searchParams.get('expired') === 'true'
    const user = USERS.find(u => u.loginId === loginId) || USERS[0]

    // 만료 테스트: 10분 전 타임스탬프 사용
    const ts = expired
      ? String(Date.now() - 10 * 60 * 1000)
      : String(Date.now())

    const canonical = `loginId=${user.loginId}&empNo=${user.empNo}&name=${user.name}&ts=${ts}`
    const sig = createHmac('sha256', HMAC_SECRET).update(canonical).digest('hex')

    const params = new URLSearchParams({
      loginId: user.loginId,
      empNo: user.empNo,
      name: user.name,
      ts,
      sig,
    })

    const embedUrl = `${CHATBOT_URL}/embed/${appId}?${params.toString()}`

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ url: embedUrl, canonical, sig, ts }))
    return
  }

  // 시나리오 3 부속: 사용자 확인 API (챗봇이 호출)
  if (pathname === '/api/verify-user' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { loginId, empNo } = JSON.parse(body)
        const timestamp = new Date().toLocaleTimeString()

        const user = USERS.find(u => u.loginId === loginId && u.empNo === empNo)

        if (user) {
          const log = `<span style="color:#68d391;">[${timestamp}] ✅ 확인됨: ${user.name} (${loginId} / ${empNo})</span>`
          verifyLogs.push(log)
          console.log(`[${timestamp}] ✅ 사용자 확인: ${user.name} (${loginId} / ${empNo})`)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            empNo: user.empNo,
            loginId: user.loginId,
            name: user.name,
            department: user.department,
            role: user.role,
          }))
        }
        else {
          const log = `<span style="color:#fc8181;">[${timestamp}] ❌ 미확인: ${loginId} / ${empNo}</span>`
          verifyLogs.push(log)
          console.log(`[${timestamp}] ❌ 사용자 미확인: ${loginId} / ${empNo}`)

          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'User not found' }))
        }
      }
      catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid request body' }))
      }
    })
    return
  }

  // 사용자 확인 API 로그 조회
  if (pathname === '/api/verify-log' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ logs: verifyLogs.slice(-20) }))
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

// 서버 시작
server.listen(PORT, async () => {
  console.log('')
  console.log('='.repeat(60))
  console.log('  🏛  레거시 포털 시뮬레이터')
  console.log('='.repeat(60))
  console.log('')
  console.log(`  포털 URL:        http://localhost:${PORT}`)
  console.log(`  챗봇 서버:       ${CHATBOT_URL}`)
  console.log(`  사용자 확인 API: http://localhost:${PORT}/api/verify-user`)
  console.log('')
  console.log('  테스트 사용자:')
  USERS.forEach((u) => {
    console.log(`    - ${u.name} (${u.loginId} / ${u.empNo})`)
  })
  console.log('')
  console.log('='.repeat(60))
  console.log('')

  // 앱 목록 가져오기
  await fetchPublicApps()
  if (cachedApps.length > 0) {
    console.log(`  📋 공개 챗봇 ${cachedApps.length}개 로드됨`)
    cachedApps.forEach(a => console.log(`    - ${a.nameKo || a.name} (${a.id})`))
  }
  console.log('')
})
