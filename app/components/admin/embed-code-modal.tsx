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

  const fullscreenCode = `<!-- DGIST AI 챗봇 - 화면배치형 -->
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

  const floatingCode = `<!-- DGIST AI 챗봇 - 아이콘형 (플로팅 버튼) -->
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800 mb-1">사용 전 주의사항</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• JWT 토큰을 실제 값으로 교체해야 합니다</li>
                        <li>• 토큰은 서버에서 생성하여 사용하는 것을 권장합니다</li>
                        <li>• 토큰 유효 기간은 1시간입니다</li>
                        <li>• 자세한 내용은 개발 문서를 참고하세요</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
