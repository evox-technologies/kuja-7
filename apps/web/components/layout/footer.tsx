'use client'

import Link from 'next/link'
import { Globe, Camera, Phone } from 'lucide-react'
import Logo from '@/components/layout/logo'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function Footer() {
  const { messages } = useI18n()

  return (
    <footer className="relative overflow-hidden bg-[#160a0e] text-gray-400">
      {/* Brand accent line + soft glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 grid grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="inline-block mb-4 transition-opacity hover:opacity-80">
            <Logo className="text-2xl text-white" />
          </Link>
          <p className="text-sm leading-relaxed mb-6 max-w-xs text-gray-400/90">
            {messages.footer.blurb}
          </p>
          <div className="flex gap-2.5">
            {[Globe, Camera, Phone].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 grid place-items-center rounded-full bg-white/5 ring-1 ring-white/10 text-gray-300 hover:bg-brand hover:text-white hover:ring-brand transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
            {messages.footer.quickLinksTitle}
          </h4>
          <ul className="space-y-2.5">
            {messages.footer.quickLinks.map((label) => (
              <li key={label}>
                <Link
                  href="#"
                  className="text-sm text-gray-400 hover:text-brand transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help & Support */}
        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
            {messages.footer.supportLinksTitle}
          </h4>
          <ul className="space-y-2.5">
            {messages.footer.supportLinks.map((label) => (
              <li key={label}>
                <Link
                  href="#"
                  className="text-sm text-gray-400 hover:text-brand transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="relative border-t border-white/10 py-5 text-center text-xs text-gray-500">
        © 2026 {messages.footer.brand}. All rights reserved.
      </div>
    </footer>
  )
}
