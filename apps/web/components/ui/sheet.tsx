'use client'

import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-brand">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

interface FieldLabelProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function FieldLabel({ label, children, className }: FieldLabelProps) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-xs font-medium text-gray-600 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export function PrivacyBanner({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-xs text-gray-600 mb-4">
      <span className="text-sky-500 font-bold">i</span>
      <p>{text}</p>
    </div>
  )
}
