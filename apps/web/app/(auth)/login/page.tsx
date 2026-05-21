'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import GoogleButton from '@/components/auth/google-button'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-md">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-xl px-8 py-10"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
        <p className="text-sm text-gray-400 mb-6">Log in to continue your journey.</p>
        <hr className="mb-6 border-gray-100" />

        <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
          Email
        </label>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-xl mb-4"
          autoFocus
        />

        <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">
          Password
        </label>
        <div className="relative mb-4">
          <Input
            type={showPass ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="rounded-xl pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <Button
          variant="gradient"
          className="w-full rounded-full"
          size="lg"
          onClick={login}
          disabled={loading || !email || !password}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </Button>

        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-gray-100" />
          <span className="text-xs text-gray-300">or</span>
          <hr className="flex-1 border-gray-100" />
        </div>

        <GoogleButton label="Continue with Google" />

        <p className="text-center text-xs text-gray-400 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
