'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './lang/common.en'
import commonKo from './lang/common.ko'
import commonEs from './lang/common.es'
import commonZh from './lang/common.zh'
import commonVi from './lang/common.vi'
import commonJa from './lang/common.ja'
import commonFr from './lang/common.fr'
import appEn from './lang/app.en'
import appKo from './lang/app.ko'
import appEs from './lang/app.es'
import appZh from './lang/app.zh'
import appVi from './lang/app.vi'
import appJa from './lang/app.ja'
import appFr from './lang/app.fr'
import toolsEn from './lang/tools.en'
import toolsKo from './lang/tools.ko'
import toolsZh from './lang/tools.zh'
import toolsVi from './lang/tools.vi'
import toolsJa from './lang/tools.ja'
import toolsFr from './lang/tools.fr'

import type { Locale } from '.'

const LANGUAGE_STORAGE_KEY = 'dgist-ai-language'

// OS/브라우저 언어 감지 및 사용자 선택 저장
const getDefaultLanguage = (): Locale => {
  // 브라우저 환경인지 확인
  if (typeof window === 'undefined') {
    // SSR에서는 한국어 기본값 (한국어 서비스)
    return 'ko'
  }

  // 1. localStorage에서 사용자 선택 확인
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved && ['ko', 'en', 'es', 'zh-Hans', 'ja', 'fr'].includes(saved)) {
      return saved as Locale
    }
  }
  catch {
    // localStorage 접근 실패 시 무시
  }

  // 2. 브라우저 언어 감지
  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'ko') {
    return 'ko'
  }
  if (browserLang === 'en') {
    return 'en'
  }

  // 3. 폴백: 한국어 (한국어 서비스)
  return 'ko'
}

// 언어 선택 저장
export const saveLanguagePreference = (lang: Locale) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }
  catch {
    // localStorage 접근 실패 시 무시
  }
}

const resources = {
  'en': {
    translation: {
      common: commonEn,
      app: appEn,
      tools: toolsEn,
    },
  },
  'ko': {
    translation: {
      common: commonKo,
      app: appKo,
      tools: toolsKo,
    },
  },
  'es': {
    translation: {
      common: commonEs,
      app: appEs,
    },
  },
  'zh-Hans': {
    translation: {
      common: commonZh,
      app: appZh,
      tools: toolsZh,
    },
  },
  'vi': {
    translation: {
      common: commonVi,
      app: appVi,
      tools: toolsVi,
    },
  },
  'ja': {
    translation: {
      common: commonJa,
      app: appJa,
      tools: toolsJa,
    },
  },
  'fr': {
    translation: {
      common: commonFr,
      app: appFr,
      tools: toolsFr,
    },
  },
}

const defaultLang = getDefaultLanguage()

i18n.use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: defaultLang,
    fallbackLng: 'en',
    debug: false,
    resources,
  })

export const changeLanguage = (lan: Locale) => {
  i18n.changeLanguage(lan)
  saveLanguagePreference(lan)
}

export const getCurrentLanguage = (): Locale => {
  return (i18n.language as Locale) || 'en'
}

export default i18n
