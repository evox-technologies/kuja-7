import { useEffect, useState } from 'react'

// ponytail: heuristic scorer, not zxcvbn (250kb). 0=empty .. 4=strong.
// Upgrade to zxcvbn only if product wants real entropy estimates.
export function passwordScore(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const LABELS = ['weak', 'weak', 'fair', 'good', 'strong'] as const
export function passwordLabel(score: number) {
  return LABELS[score] ?? 'weak'
}

// Resend cooldown so the UI reflects Supabase's email rate limit.
export function useCooldown() {
  const [until, setUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (until <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [until])
  const remaining = Math.max(0, Math.ceil((until - now) / 1000))
  return { remaining, start: (seconds: number) => setUntil(Date.now() + seconds * 1000) }
}

// Pull the wait time out of a Supabase rate-limit error, else 60s for any 429.
export function rateLimitSeconds(error: { message?: string; status?: number } | null): number | null {
  if (!error) return null
  const m = error.message?.match(/(\d+)\s*seconds?/i)
  if (m) return parseInt(m[1], 10)
  if (error.status === 429) return 60
  return null
}
