'use client'

import {
  formatHeight,
  heightToInches,
  HEIGHT_MAX_IN,
  HEIGHT_MIN_IN,
} from '@/lib/height'

/**
 * Form controls for the admin portal, matching the house style established by
 * app/(dashboard)/dashboard/profile/page.tsx — same input class, same tiny
 * uppercase labels, same red asterisk on required fields.
 */

export const inputCls =
  'w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors'

const errorCls = ' border-danger bg-danger-bg ring-2 ring-danger-border focus:border-danger focus:ring-danger-border'

export function RequiredStar() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden>
      *
    </span>
  )
}

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">
      {label}
      {required && <RequiredStar />}
    </span>
  )
}

export function FormField({
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  hint,
}: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  error?: boolean
  hint?: string
}) {
  return (
    <label className="block" data-field={name}>
      <Label label={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error || undefined}
        aria-required={required || undefined}
        className={inputCls + (error ? errorCls : '')}
      />
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

export function FormSelect({
  name,
  label,
  value,
  onChange,
  options,
  required,
  error,
  placeholder = '— Select —',
}: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  required?: boolean
  error?: boolean
  placeholder?: string
}) {
  return (
    <label className="block" data-field={name}>
      <Label label={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error || undefined}
        className={inputCls + ' appearance-none' + (error ? errorCls : '')}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FormDate({
  name,
  label,
  value,
  onChange,
  required,
  error,
  max,
  hint,
}: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: boolean
  max?: string
  hint?: string
}) {
  return (
    <label className="block" data-field={name}>
      <Label label={label} required={required} />
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error || undefined}
        className={inputCls + (error ? errorCls : '')}
      />
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

export function FormTextarea({
  name,
  label,
  value,
  onChange,
  rows = 3,
  required,
  error,
  placeholder,
}: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  required?: boolean
  error?: boolean
  placeholder?: string
}) {
  return (
    <label className="block" data-field={name}>
      <Label label={label} required={required} />
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error || undefined}
        className={inputCls + ' resize-y' + (error ? errorCls : '')}
      />
    </label>
  )
}

/**
 * Heights are stored as display strings (`5' 6"`), not numbers — see
 * lib/height.ts — so the slider converts in both directions.
 */
export function HeightField({
  name,
  value,
  onChange,
  required,
  error,
}: {
  name?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: boolean
}) {
  const inches = heightToInches(value)

  return (
    <div
      data-field={name}
      className={error ? 'rounded-xl bg-danger-bg ring-2 ring-danger-border' : ''}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-gray-400">
          Height
          {required && <RequiredStar />}
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          {formatHeight(inches)}
        </span>
      </div>
      <input
        type="range"
        min={HEIGHT_MIN_IN}
        max={HEIGHT_MAX_IN}
        step={1}
        value={inches}
        onChange={(e) => onChange(formatHeight(Number(e.target.value)))}
        className="h-2 w-full cursor-pointer accent-brand"
        aria-label="Height"
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{formatHeight(HEIGHT_MIN_IN)}</span>
        <span>{formatHeight(HEIGHT_MAX_IN)}</span>
      </div>
    </div>
  )
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">{children}</div>
}

/**
 * A derived value shown in the field grid — same label and box as the editable
 * fields so a computed cell (age from date of birth) doesn't break the row
 * rhythm, but greyed and non-interactive so it doesn't read as an input.
 */
export function FormReadout({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="block">
      <Label label={label} />
      <output className={inputCls + ' block bg-gray-50 text-gray-600'}>{value || '—'}</output>
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </div>
  )
}
