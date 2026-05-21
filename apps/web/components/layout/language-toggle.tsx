'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

const LANGS = [
  { value: 'si', label: 'සිං' },
  { value: 'en', label: 'Eng' },
]

interface LanguageToggleProps {
  dark?: boolean
}

export default function LanguageToggle({ dark = false }: LanguageToggleProps) {
  const [lang, setLang] = useState('en')

  return (
    <div
      className={`hidden sm:flex items-center rounded-full p-0.5 text-xs ${
        dark ? 'bg-white/10' : 'bg-gray-100'
      }`}
    >
      {LANGS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLang(value)}
          className="relative px-3 py-1.5 rounded-full font-medium focus:outline-none"
        >
          {lang === value && (
            <motion.span
              layoutId={dark ? 'lang-pill-dark' : 'lang-pill'}
              className={`absolute inset-0 rounded-full shadow-sm ${
                dark ? 'bg-white/20' : 'bg-white'
              }`}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-150 ${
              dark
                ? lang === value
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/80'
                : lang === value
                  ? 'text-gray-800'
                  : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
