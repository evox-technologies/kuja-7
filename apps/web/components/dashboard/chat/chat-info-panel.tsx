'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { defaultAvatarSrc } from '@/lib/avatar'

interface OtherProfileSummary {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  avatarUrl?: string | null
  gender?: string | null
  kujaNumber?: string | null
  city?: string | null
  country?: string | null
  ethnicity?: string | null
  profession?: string | null
  religion?: string | null
  height?: string | null
}

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

interface Props {
  otherId: string
}

export default function ChatInfoPanel({ otherId }: Props) {
  const [profile, setProfile] = useState<OtherProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setProfile(null)

    apiFetch<OtherProfileSummary>(`/users/${otherId}`)
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [otherId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-sm text-gray-400 text-center">Couldn&apos;t load profile</p>
      </div>
    )
  }

  const cityCountry = [profile.city, profile.country].filter(Boolean).join(', ')
  const avatarSrc = profile.avatarUrl ?? defaultAvatarSrc(profile.gender)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <User className="w-9 h-9 text-gray-300" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="font-semibold text-gray-900">
            {profile.firstName} {profile.lastName}
          </span>
          {profile.kujaNumber && (
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Kuja {profile.kujaNumber}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-1">
          Age {age(profile.dateOfBirth)}
          {cityCountry && <> &nbsp;·&nbsp; {cityCountry}</>}
        </p>

        <div className="mt-4 w-full flex flex-col gap-2 text-sm text-gray-600 text-left">
          {profile.profession && <span>💼 {profile.profession}</span>}
          {profile.ethnicity && <span>👤 {profile.ethnicity}</span>}
          {profile.religion && <span>🕌 {profile.religion}</span>}
          {profile.height && <span>📏 {profile.height}</span>}
        </div>

        <Link
          href={`/dashboard/user?id=${profile.id}`}
          className="mt-5 w-full px-4 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:border-brand hover:text-brand transition-colors text-center"
        >
          View full profile →
        </Link>
      </div>
    </div>
  )
}
