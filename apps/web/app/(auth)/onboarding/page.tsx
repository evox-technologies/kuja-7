'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api'

type Step = 'basics' | 'details'

const slide = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  const [religion, setReligion] = useState('')
  const [profession, setProfession] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) { router.replace('/login'); return }
        setEmail(session.user.email ?? '')
      })
  }, [router])

  async function submitBasics() {
    if (!firstName || !lastName || !gender || !dateOfBirth) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setStep('details')
  }

  async function submitProfile() {
    setLoading(true)
    setError('')
    try {
      await apiFetch('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          gender,
          dateOfBirth,
          ...(religion ? { religion } : {}),
          ...(profession ? { profession } : {}),
          ...(location ? { location } : {}),
        }),
      })
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <AnimatePresence mode="wait">
        {step === 'basics' && (
          <motion.div
            key="basics"
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-xl px-8 py-10"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Profile</h1>
            <p className="text-sm text-gray-400 mb-6">Tell us a little about yourself to get started.</p>
            <hr className="mb-6 border-gray-100" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="rounded-xl"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="Last name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Gender <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['MALE', 'FEMALE'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        gender === g
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="rounded-xl"
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-4">{error}</p>}

            <Button
              variant="gradient"
              className="w-full rounded-full mt-6"
              size="lg"
              onClick={submitBasics}
              disabled={!firstName || !lastName || !gender || !dateOfBirth}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-xl px-8 py-10"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-1">A Bit More About You</h1>
            <p className="text-sm text-gray-400 mb-6">These help others find meaningful matches. All optional.</p>
            <hr className="mb-6 border-gray-100" />

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Religion
                </label>
                <Input
                  placeholder="e.g. Islam, Christianity…"
                  value={religion}
                  onChange={e => setReligion(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Profession
                </label>
                <Input
                  placeholder="e.g. Engineer, Teacher…"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                  Location
                </label>
                <Input
                  placeholder="e.g. London, UK"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mt-4">{error}</p>}

            <Button
              variant="gradient"
              className="w-full rounded-full mt-6"
              size="lg"
              onClick={submitProfile}
              disabled={loading}
            >
              {loading ? 'Creating profile…' : 'Get Started'}
            </Button>
            <button
              onClick={() => { setStep('basics'); setError('') }}
              className="w-full text-center text-xs text-gray-400 mt-4 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
