'use client'

import { upload } from '@/service/base'

interface ImageUploadParams {
  file: File
  onProgressCallback: (progress: number) => void
  onSuccessCallback: (res: { id: string }) => void
  onErrorCallback: () => void
  appId?: string
}
type ImageUpload = (v: ImageUploadParams) => void
export const imageUpload: ImageUpload = ({
  file,
  onProgressCallback,
  onSuccessCallback,
  onErrorCallback,
  appId,
}) => {
  const formData = new FormData()
  formData.append('file', file)
  const onProgress = (e: ProgressEvent) => {
    if (e.lengthComputable) {
      const percent = Math.floor(e.loaded / e.total * 100)
      onProgressCallback(percent)
    }
  }

  upload({
    xhr: new XMLHttpRequest(),
    data: formData,
    onprogress: onProgress,
  }, appId)
    .then((res: { id: string }) => {
      onSuccessCallback(res)
    })
    .catch(() => {
      onErrorCallback()
    })
}
