'use client'

import { toast } from '@/hooks/use-toast'

export interface IToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  message: string
}

// type을 shadcn variant로 변환
function getVariant(type: IToastProps['type']) {
  switch (type) {
    case 'error':
      return 'destructive' as const
    case 'success':
      return 'success' as const
    default:
      return 'default' as const
  }
}

// notify 함수
const notify = ({ type = 'info', message }: IToastProps) => {
  toast({
    title: message,
    variant: getVariant(type),
  })
}

// shadcn toast를 사용하는 호환성 래퍼
const Toast = {
  notify,
}

// useToastContext 호환성 훅
export const useToastContext = () => {
  return { notify }
}

export default Toast
