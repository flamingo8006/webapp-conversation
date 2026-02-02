import type { FC } from 'react'
import React from 'react'
import AppIcon from '@/app/components/base/app-icon'

export interface ISimpleHeaderProps {
  title: string
  isMobile?: boolean
}

const SimpleHeader: FC<ISimpleHeaderProps> = ({
  title,
  isMobile,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-center h-12 px-3 bg-gray-100">
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className=" text-sm text-gray-800 font-bold">{title}</div>
      </div>
    </div>
  )
}

export default React.memo(SimpleHeader)
