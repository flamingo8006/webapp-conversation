'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { changeLanguage, getCurrentLanguage } from '@/i18n/i18next-config'
import type { Locale } from '@/i18n'
import { cn } from '@/lib/utils'

interface LanguageOption {
  code: Locale
  label: string
  flag: string
}

const languages: LanguageOption[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const currentLang = getCurrentLanguage()

  const handleLanguageChange = (lang: Locale) => {
    changeLanguage(lang)
    setIsOpen(false)
  }

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[1]

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant={variant === 'compact' ? 'ghost' : 'outline'}
        size={variant === 'compact' ? 'icon' : 'sm'}
        className={className}
        onClick={() => setIsOpen(!isOpen)}
      >
        {variant === 'compact'
          ? (
            <Globe className="h-4 w-4" />
          )
          : (
            <>
              <span className="mr-1.5">{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.label}</span>
              <Globe className="ml-1.5 h-3.5 w-3.5 sm:hidden" />
            </>
          )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[120px]">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 first:rounded-t-md last:rounded-b-md',
                currentLang === lang.code && 'bg-accent',
              )}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
