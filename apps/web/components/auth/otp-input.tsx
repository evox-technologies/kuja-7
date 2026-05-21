'use client'

import { useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export default function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const next = [...value]
    next[index] = char
    onChange(next)
    if (char && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    const next = [...value]
    digits.forEach((d, i) => { next[i] = d })
    onChange(next)
    refs.current[Math.min(digits.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          placeholder="–"
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'w-10 h-12 text-center text-lg font-semibold rounded-xl border',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
            'placeholder:text-gray-300 disabled:opacity-50 transition-colors',
            value[i] ? 'border-brand/50 bg-brand-50' : 'border-gray-200 bg-white'
          )}
        />
      ))}
    </div>
  )
}
