'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Info, Shield } from 'lucide-react'
import { useAuth } from '@/app/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * 로그인 페이지
 * Phase 9a: 직접 로그인 폼 제거, 안내 페이지로 변경
 * - 일반 사용자: 레거시 포털을 통해 접속
 * - 관리자: /admin/login 으로 이동
 */
export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // 이미 로그인된 경우 메인으로 이동
  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">DGIST AI 챗봇</CardTitle>
          <CardDescription>인증 방법 안내</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              DGIST AI 챗봇 서비스는 포털 시스템을 통해 접속해야 합니다.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Home className="h-4 w-4" />
                일반 사용자
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                DGIST 포털 시스템에서 &quot;AI 챗봇&quot; 메뉴를 클릭하면 자동으로 로그인됩니다.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  게스트로 공개 챗봇 사용
                </Link>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                관리자
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                챗봇 관리 기능을 사용하려면 관리자 로그인이 필요합니다.
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/login">
                  관리자 로그인
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p className="w-full">
            문의: 정보전산팀
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
