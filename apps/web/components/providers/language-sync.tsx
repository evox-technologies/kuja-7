'use client'

import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function LanguageSync() {
  const { locale, messages } = useI18n()

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = messages.meta.title
  }, [locale, messages.meta.title])

  return null
}

