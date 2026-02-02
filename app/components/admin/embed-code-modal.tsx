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

  // 임베드 코드 생성
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

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
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    z-index: 9998;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  #dgist-chatbot-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5);
  }
  #dgist-chatbot-btn svg {
    width: 28px;
    height: 28px;
    color: white;
  }
  #dgist-chatbot-iframe {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9999;
    display: none;
  }
  #dgist-chatbot-iframe.open {
    display: block;
  }
</style>

<button id="dgist-chatbot-btn" onclick="toggleChatbot()">
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
</button>

<iframe id="dgist-chatbot-iframe" src="${baseUrl}/simple-chat/${app?.id}"></iframe>

<script>
  function toggleChatbot() {
    var iframe = document.getElementById('dgist-chatbot-iframe');
    iframe.classList.toggle('open');
  }
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
          {!embedType ? (
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
          ) : (
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
              {isPublicAnonymous ? (
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
              ) : (
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
