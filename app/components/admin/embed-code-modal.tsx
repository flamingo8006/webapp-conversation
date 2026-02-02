'use client'

import { useState } from 'react'
import Toast from '@/app/components/base/toast'
import type { AppConfig } from '@/hooks/use-app'

interface EmbedCodeModalProps {
  app: AppConfig
  isOpen: boolean
  onClose: () => void
}

type EmbedType = 'fullscreen' | 'floating' | null

export function EmbedCodeModal({ app, isOpen, onClose }: EmbedCodeModalProps) {
  const [embedType, setEmbedType] = useState<EmbedType>(null)

  if (!isOpen)
    return null

  // 임베드 코드 생성
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  // 공개 + 익명 허용 챗봇인지 확인
  const isPublicAnonymous = app.isPublic && app.allowAnonymous

  // 공개 익명 챗봇용 코드 (토큰 불필요)
  const publicFullscreenCode = `<!-- DGIST AI 챗봇 - 화면배치형 (공개) -->
<iframe
  src="${baseUrl}/simple-chat/${app.id}"
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

<iframe id="dgist-chatbot-iframe" src="${baseUrl}/simple-chat/${app.id}"></iframe>

<script>
  function toggleChatbot() {
    var iframe = document.getElementById('dgist-chatbot-iframe');
    iframe.classList.toggle('open');
  }
</script>`

  // 인증 필요 챗봇용 코드 (토큰 필요)
  const authFullscreenCode = `<!-- DGIST AI 챗봇 - 화면배치형 (인증 필요) -->
<iframe
  src="${baseUrl}/embed/${app.id}?token=YOUR_JWT_TOKEN"
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
  iframe.src = '${baseUrl}/embed/${app.id}?token=' + token;
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              {embedType && (
                <button
                  onClick={handleBack}
                  className="mr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {embedType ? '임베드 코드' : '임베드 방법 선택'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {!embedType ? (
              // 임베드 방법 선택
              <div className="space-y-3">
                <button
                  onClick={() => setEmbedType('fullscreen')}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">화면배치형</p>
                      <p className="text-sm text-gray-500">
                        웹페이지 영역에 챗봇을 iframe으로 배치합니다
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setEmbedType('floating')}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">아이콘형 (플로팅 버튼)</p>
                      <p className="text-sm text-gray-500">
                        화면 우측 하단에 플로팅 버튼으로 표시합니다
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              // 임베드 코드 표시
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {embedType === 'fullscreen' ? '화면배치형' : '아이콘형 (플로팅 버튼)'} HTML 코드
                    </p>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      복사
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{embedType === 'fullscreen' ? fullscreenCode : floatingCode}</code>
                  </pre>
                </div>

                {/* 사용 안내 */}
                {isPublicAnonymous ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-green-800 mb-1">공개 챗봇 - 바로 사용 가능</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• 이 챗봇은 공개 설정되어 있어 토큰 없이 사용 가능합니다</li>
                          <li>• 코드를 복사하여 웹페이지에 바로 붙여넣으세요</li>
                          {(app.maxAnonymousMsgs ?? 0) > 0 && (
                            <li>• 익명 사용자당 최대 {app.maxAnonymousMsgs}개 메시지 제한</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1">인증 필요 - JWT 토큰 설정 필요</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• JWT 토큰을 실제 값으로 교체해야 합니다</li>
                          <li>• 토큰은 서버에서 생성하여 사용하는 것을 권장합니다</li>
                          <li>• 토큰 유효 기간은 1시간입니다</li>
                          <li>• 자세한 내용은 개발 문서를 참고하세요</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
