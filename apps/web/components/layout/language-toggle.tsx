'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

const LANGS = [
  { value: 'si', label: 'සිං' },
  { value: 'en', label: 'Eng' },
]

export default function LanguageToggle() {
  const [lang, setLang] = useState('en')

  return (
    <div className="hidden sm:flex items-center rounded-full bg-gray-100 p-0.5 text-xs">
      {LANGS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLang(value)}
          className="relative px-3 py-1.5 rounded-full font-medium focus:outline-none"
        >
          {/* Sliding pill indicator */}
          {lang === value && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-150 ${
              lang === value ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
