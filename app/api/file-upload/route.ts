import type { NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'
import { errorCapture } from '@/lib/error-capture'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user } = getInfo(request)
    formData.append('user', user)
    const res = await client.fileUpload(formData)
    return new Response(String(res.data.id))
  }
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    errorCapture.captureApiError(e, request).catch(() => {})
    return new Response(message)
  }
}
