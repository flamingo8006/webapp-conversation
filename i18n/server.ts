import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

// Check if a locale string is valid for Intl
function isValidLocale(locale: string): boolean {
  if (!locale || locale === '*')
  { return false }
  try {
    Intl.getCanonicalLocales(locale)
    return true
  }
  catch {
    return false
  }
}

export const getLocaleOnServer = async (): Promise<Locale> => {
  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales

  let languages: string[] | undefined
  // get locale from cookie
  const localeCookie = (await cookies()).get('locale')
  languages = localeCookie?.value ? [localeCookie.value] : []

  if (!languages.length) {
    // Negotiator expects plain object so we need to transform headers
    const negotiatorHeaders: Record<string, string> = {}
    const headersList = await headers()
    headersList.forEach((value, key) => (negotiatorHeaders[key] = value))
    // Use negotiator and intl-localematcher to get best locale
    languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  }

  // Filter out invalid locale values (e.g., '*', empty strings)
  const validLanguages = languages.filter(isValidLocale)

  // If no valid languages, use default locale
  if (!validLanguages.length) {
    return i18n.defaultLocale as Locale
  }

  // match locale
  const matchedLocale = match(validLanguages, locales, i18n.defaultLocale) as Locale
  return matchedLocale
}
