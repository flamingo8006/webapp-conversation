'use client'

import { useState } from 'react'
import { ArrowLeft, LayoutGrid, MessageSquare, CheckCircle, AlertTriangle, Copy } from 'lucide-react'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface EmbedCodeModalProps {
  app: AppConfig
  isOpen: boolean
  onClose: () => void
}

type EmbedType = 'fullscreen' | 'floating' | null

export function EmbedCodeModal({ app, isOpen, onClose }: EmbedCodeModalProps) {
  const [embedType, setEmbedType] = useState<EmbedType>(null)

  // 임베드 코드 생성: 환경변수 우선, 없으면 현재 origin 사용
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

  // 공개 + 익명 허용 챗봇인지 확인
  const isPublicAnonymous = app?.isPublic && app?.allowAnonymous

  // 공개 익명 챗봇용 코드 (토큰 불필요)
  const publicFullscreenCode = `<!-- DGIST AI 챗봇 - 화면배치형 (공개) -->
<iframe
  src="${baseUrl}/simple-chat/${app?.id}"
  style="width: 100%; height: 100%; min-height: 700px"
  frameborder="0"
  allow="microphone">
</iframe>`

  const publicFloatingCode = `<!-- DGIST AI 챗봇 - 아이콘형 (공개) -->
<style>
  #dgist-chatbot-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 9998;
    transition: transform 0.3s, box-shadow 0.3s;
    overflow: hidden;
    padding: 0;
    background: transparent;
  }
  #dgist-chatbot-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
  }
  #dgist-chatbot-btn .icon-chat,
  #dgist-chatbot-btn .icon-close {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.25);
    transition: opacity 0.3s, transform 0.3s;
  }
  #dgist-chatbot-btn .icon-close {
    opacity: 0;
    transform: scale(1.25) rotate(90deg);
  }
  #dgist-chatbot-btn.active .icon-chat {
    opacity: 0;
    transform: scale(1.25) rotate(-90deg);
  }
  #dgist-chatbot-btn.active .icon-close {
    opacity: 1;
    transform: scale(1.25) rotate(0deg);
  }
  #dgist-chatbot-container {
    position: fixed;
    bottom: 95px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  #dgist-chatbot-container.open {
    pointer-events: auto;
    opacity: 1;
    transform: translateY(0);
  }
  #dgist-chatbot-container.closing {
    pointer-events: none;
    opacity: 0;
    transform: translateY(20px);
  }
  #dgist-chatbot-wrapper {
    position: relative;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    overflow: hidden;
  }
  #dgist-chatbot-iframe {
    border: none;
    display: block;
  }
  #dgist-chatbot-resize {
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    cursor: nw-resize;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #dgist-chatbot-resize:hover svg {
    fill: #3b82f6;
  }
  #dgist-chatbot-resize svg {
    width: 12px;
    height: 12px;
    fill: #9ca3af;
    transition: fill 0.2s;
  }
</style>

<button id="dgist-chatbot-btn" onclick="toggleChatbot()">
  <img class="icon-chat" src="${baseUrl}/icons/chat_floating_button.svg" alt="Chat" />
  <img class="icon-close" src="${baseUrl}/icons/chat_close_button.svg" alt="Close" />
</button>

<div id="dgist-chatbot-container">
  <div id="dgist-chatbot-wrapper">
    <div id="dgist-chatbot-resize" title="드래그하여 크기 조절">
      <svg viewBox="0 0 16 16"><path d="M2 2h4v2H4v2H2V2zm0 6h2v2h2v2H2V8z"/></svg>
    </div>
    <iframe id="dgist-chatbot-iframe" src="${baseUrl}/simple-chat/${app?.id}"></iframe>
  </div>
</div>

<script>
  (function() {
    var container = document.getElementById('dgist-chatbot-container');
    var wrapper = document.getElementById('dgist-chatbot-wrapper');
    var iframe = document.getElementById('dgist-chatbot-iframe');
    var btn = document.getElementById('dgist-chatbot-btn');
    var resizeHandle = document.getElementById('dgist-chatbot-resize');
    var STORAGE_KEY = 'dgist-chatbot-size';
    var MIN_W = 320, MIN_H = 400, MAX_W = 800, MAX_H = 900;
    var size = { width: 400, height: 600 };
    var isResizing = false, startX, startY, startW, startH;
    var isOpen = false;

    // 저장된 크기 불러오기
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        size.width = Math.min(Math.max(parsed.width || 400, MIN_W), MAX_W);
        size.height = Math.min(Math.max(parsed.height || 600, MIN_H), MAX_H);
      }
    } catch(e) {}

    function applySize() {
      wrapper.style.width = size.width + 'px';
      wrapper.style.height = size.height + 'px';
      iframe.style.width = size.width + 'px';
      iframe.style.height = size.height + 'px';
    }
    applySize();

    resizeHandle.addEventListener('mousedown', function(e) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = size.width;
      startH = size.height;
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;
      var dx = startX - e.clientX;
      var dy = startY - e.clientY;
      size.width = Math.min(Math.max(startW + dx, MIN_W), MAX_W);
      size.height = Math.min(Math.max(startH + dy, MIN_H), MAX_H);
      applySize();
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(size)); } catch(e) {}
      }
    });

    window.toggleChatbot = function() {
      if (isOpen) {
        // 닫기 애니메이션
        container.classList.add('closing');
        container.classList.remove('open');
        btn.classList.remove('active');
        setTimeout(function() {
          container.classList.remove('closing');
        }, 300);
      } else {
        // 열기 애니메이션
        container.classList.add('open');
        btn.classList.add('active');
      }
      isOpen = !isOpen;
    };
  })();
</script>`

  // 인증 필요 챗봇용 코드 (토큰 필요)
  const authFullscreenCode = `<!-- DGIST AI 챗봇 - 화면배치형 (인증 필요) -->
<iframe
  src="${baseUrl}/embed/${app?.id}?token=YOUR_JWT_TOKEN"
  style="width: 100%; height: 100%; min-height: 700px"
  frameborder="0"
  allow="microphone">
</iframe>

<!--
  주의: YOUR_JWT_TOKEN을 실제 JWT 토큰으로 교체하세요.
  토큰 생성 방법:

  POST ${baseUrl}/api/auth/embed-token
  Content-Type: application/json

  {
    "loginId": "사용자ID",
    "empNo": "사원번호",
    "name": "이름",
    "role": "user"
  }
-->`

  const authFloatingCode = `<!-- DGIST AI 챗봇 - 아이콘형 (인증 필요) -->
<div id="dgist-chatbot-container"></div>

<script>
(async function() {
  // 1. JWT 토큰 생성 (서버에서 발급받은 토큰 사용)
  const response = await fetch('${baseUrl}/api/auth/embed-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'YOUR_LOGIN_ID',
      empNo: 'YOUR_EMP_NO',
      name: 'YOUR_NAME',
      role: 'user'
    })
  });
  const { token } = await response.json();

  // 2. iframe 생성 및 삽입
  const iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/embed/${app?.id}?token=' + token;
  iframe.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 9999;';

  document.getElementById('dgist-chatbot-container').appendChild(iframe);
})();
</script>

<!--
  주의: YOUR_LOGIN_ID, YOUR_EMP_NO, YOUR_NAME을 실제 값으로 교체하세요.
  보안상 토큰은 서버에서 생성하는 것을 권장합니다.
-->`

  // 앱 설정에 따라 적절한 코드 선택
  const fullscreenCode = isPublicAnonymous ? publicFullscreenCode : authFullscreenCode
  const floatingCode = isPublicAnonymous ? publicFloatingCode : authFloatingCode

  const handleCopy = () => {
    const code = embedType === 'fullscreen' ? fullscreenCode : floatingCode
    navigator.clipboard.writeText(code)
    Toast.notify({
      type: 'success',
      message: '코드가 클립보드에 복사되었습니다.',
    })
  }

  const handleBack = () => {
    setEmbedType(null)
  }

  const handleClose = () => {
    setEmbedType(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center">
            {embedType && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {embedType ? '임베드 코드' : '임베드 방법 선택'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {!embedType
            ? (
            // 임베드 방법 선택
              <div className="space-y-3">
                <button
                  onClick={() => setEmbedType('fullscreen')}
                  className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <LayoutGrid className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">화면배치형</p>
                      <p className="text-sm text-muted-foreground">
                        웹페이지 영역에 챗봇을 iframe으로 배치합니다
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setEmbedType('floating')}
                  className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">아이콘형 (플로팅 버튼)</p>
                      <p className="text-sm text-muted-foreground">
                        화면 우측 하단에 플로팅 버튼으로 표시합니다
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )
            : (
            // 임베드 코드 표시
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {embedType === 'fullscreen' ? '화면배치형' : '아이콘형 (플로팅 버튼)'} HTML 코드
                    </p>
                    <Button size="sm" onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      복사
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{embedType === 'fullscreen' ? fullscreenCode : floatingCode}</code>
                  </pre>
                </div>

                {/* 사용 안내 */}
                {isPublicAnonymous
                  ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">공개 챗봇 - 바로 사용 가능</AlertTitle>
                      <AlertDescription className="text-green-700">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>이 챗봇은 공개 설정되어 있어 토큰 없이 사용 가능합니다</li>
                          <li>코드를 복사하여 웹페이지에 바로 붙여넣으세요</li>
                          {(app?.maxAnonymousMsgs ?? 0) > 0 && (
                            <li>익명 사용자당 최대 {app?.maxAnonymousMsgs}개 메시지 제한</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )
                  : (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">인증 필요 - JWT 토큰 설정 필요</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>JWT 토큰을 실제 값으로 교체해야 합니다</li>
                          <li>토큰은 서버에서 생성하여 사용하는 것을 권장합니다</li>
                          <li>토큰 유효 기간은 1시간입니다</li>
                          <li>자세한 내용은 개발 문서를 참고하세요</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
