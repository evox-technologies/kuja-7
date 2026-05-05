import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LanguageToggle from '@/components/layout/language-toggle'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-widest text-gray-900">
          LOGO
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm text-gray-600 hover:text-brand transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/login">Log In</Link>
          </Button>

          <Button size="sm" className="rounded-full" asChild>
            <Link href="/register">Let&apos;s Join</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
