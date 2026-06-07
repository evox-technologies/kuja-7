'use client'

import Link from 'next/link'
import { Globe, Camera, Phone } from 'lucide-react'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function Footer() {
  const { messages } = useI18n()

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-6xl px-6 py-14 grid grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-brand rounded-sm" />
            <span className="text-white font-bold text-lg">{messages.footer.brand}</span>
          </div>
          <p className="text-xs leading-relaxed mb-5">
            {messages.footer.blurb}
          </p>
          <div className="flex gap-3">
            {[Globe, Camera, Phone].map((Icon, i) => (
              <button
                key={i}
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand transition-colors"
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
                <Link href="#" className="text-sm hover:text-white transition-colors">
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
                <Link href="#" className="text-sm hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* App Download */}
        <div>
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
            App Download
          </h4>
          <div className="space-y-2 opacity-40">
            {['Google Play', 'App Store'].map((label) => (
              <div
                key={label}
                className="border border-gray-600 rounded-lg px-4 py-2.5 text-xs text-gray-400"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-600">
        © 2026 Kuja7.lk. All rights reserved.
      </div>
    </footer>
  )
}
