import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import LanguageToggle from '@/components/layout/language-toggle'
import { asset } from '@/lib/assets'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="relative z-10 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="text-xl font-bold tracking-widest text-white">
              LOGO
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle dark />
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative flex items-center justify-center">
        <Image
          src={asset('/images/benefits.jpg')}
          alt=""
          fill
          className="object-cover object-center grayscale"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/80" />
        <div className="relative z-10 w-full px-4 py-12">
          {children}
        </div>
      </div>
    </div>
  )
}
