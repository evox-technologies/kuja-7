'use client'

import { useMemo } from 'react'
import type { Locale } from '@/lib/i18n/types'
import { useLanguageStore } from '@/lib/i18n/store'
import { en } from '@/lib/i18n/messages/en'
import { si } from '@/lib/i18n/messages/si'

const MESSAGES_BY_LOCALE = { en, si } as const

type Messages = (typeof MESSAGES_BY_LOCALE)[Locale]

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj as any)
}

export function useI18n() {
  const locale = useLanguageStore((s) => s.locale)
  const setLocale = useLanguageStore((s) => s.setLocale)

  const messages = useMemo<Messages>(() => MESSAGES_BY_LOCALE[locale], [locale])

  function t(key: string, vars?: Record<string, string>): string {
    const value = getByPath(messages, key)
    if (typeof value !== 'string') return key
    if (!vars) return value
    return Object.entries(vars).reduce(
      (str, [k, v]) => str.replaceAll(`{{${k}}}`, v),
      value,
    )
  }

  return { locale, setLocale, messages, t }
}

