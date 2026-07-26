'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { useState } from 'react'
import { useProfileGuard } from '@/contexts/profile-guard'
import { defaultAvatarSrc } from '@/lib/avatar'

export interface ProfileCardData {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  avatarUrl?: string | null
  gender?: string | null
  kujaNumber?: string | null
  city?: string | null
  country?: string | null
  location?: string | null
  ethnicity?: string | null
  profession?: string | null
  religion?: string | null
  height?: string | null
  createdAt?: string
  myInterestStatus?: 'PENDING' | 'ACCEPTED' | null
}

interface Props {
  profile: ProfileCardData
  badge?: React.ReactNode
  actions?: React.ReactNode
  note?: string
}

function age(dob: string) {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

function timeAgo(iso?: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 Day Ago'
  return `${days} Days Ago`
}

function Avatar({ profile }: { profile: ProfileCardData }) {
  const src = profile.avatarUrl ?? defaultAvatarSrc(profile.gender)
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      ) : (
        <User className="w-9 h-9 text-gray-300" />
      )}
    </div>
  )
}

export default function ProfileCard({ profile, badge, actions, note }: Props) {
  const router = useRouter()
  const { guardAction } = useProfileGuard()
  const [interestStatus, setInterestStatus] = useState<'PENDING' | 'ACCEPTED' | null>(
    profile.myInterestStatus ?? null
  )
  const [toggling, setToggling] = useState(false)
  const cityCountry = [profile.city, profile.country].filter(Boolean).join(', ') || profile.location || ''

  async function handleInterestToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return
    if (interestStatus === 'ACCEPTED') return

    // Block sending (not removing) when profile is incomplete
    if (!interestStatus) {
      guardAction(() => doSendInterest())
      return
    }

    doRemoveInterest()
  }

  async function doSendInterest() {
    setToggling(true)
    try {
      await apiFetch('/matches/interests', {
        method: 'POST',
        body: JSON.stringify({ receiverId: profile.id }),
      })
      setInterestStatus('PENDING')
    } catch {
      // noop
    } finally {
      setToggling(false)
    }
  }

  async function doRemoveInterest() {
    setToggling(true)
    try {
      await apiFetch(`/matches/interests/${profile.id}`, { method: 'DELETE' })
      setInterestStatus(null)
    } catch {
      // noop
    } finally {
      setToggling(false)
    }
  }

  const interested = interestStatus === 'PENDING' || interestStatus === 'ACCEPTED'

  function openProfile() {
    router.push(`/dashboard/user?id=${profile.id}`)
  }

  return (
    <div
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openProfile()
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <Avatar profile={profile} />

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-gray-900 text-base truncate">
                  {profile.firstName} {profile.lastName}
                </span>
                {profile.kujaNumber && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    Kuja {profile.kujaNumber}
                  </span>
                )}
                {badge}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Age: {age(profile.dateOfBirth)}
                {cityCountry && <> &nbsp;|&nbsp; <span>Live: {cityCountry}</span></>}
              </p>
            </div>
            <span className="text-xs text-gray-300 shrink-0">{timeAgo(profile.createdAt)}</span>
          </div>

          {/* Detail row */}
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
            {profile.ethnicity && <span>👤 {profile.ethnicity}</span>}
            {profile.profession && <span>💼 {profile.profession}</span>}
            {profile.religion && <span>🕌 {profile.religion}</span>}
            {profile.height && <span>📏 {profile.height}</span>}
          </div>

          {note && (
            <div className="mt-2 flex items-center gap-1 text-sm text-brand font-medium">
              <Heart className="w-3.5 h-3.5 fill-brand" />
              {note}
            </div>
          )}

          {/* Actions row */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 gap-y-2">
            <button
              onClick={handleInterestToggle}
              disabled={toggling || interestStatus === 'ACCEPTED'}
              title={interested ? (interestStatus === 'ACCEPTED' ? 'Mutual interest' : 'Remove interest') : 'Send interest'}
              className={cn(
                'p-2 rounded-full border transition-colors shrink-0',
                interested
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-gray-200 text-gray-300 hover:border-brand hover:text-brand'
              )}
            >
              <Heart className={cn('w-5 h-5', interested && 'fill-brand')} />
            </button>

            <div className="flex-1 min-w-0" />

            {actions && (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                {actions}
              </div>
            )}

            <Link
              href={`/dashboard/user?id=${profile.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand hover:text-brand transition-colors min-w-0 shrink-0"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
