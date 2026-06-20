'use client'

import { Briefcase, Building2, ChevronRight, Heart, Languages, Ruler, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MockProfile } from '@/lib/profile/types'
import { formatTimeAgo } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'

interface Props {
  profile: MockProfile
  variant?: 'home' | 'sent' | 'received' | 'mutual'
  onView?: () => void
}

export default function ProfileCard({ profile, variant = 'home', onView }: Props) {
  const { messages, locale, t } = useI18n()
  const card = messages.home.profileCard

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {profile.firstName} {profile.lastName}
              </h3>
              <span className="text-xs text-gray-400 shrink-0">
                {formatTimeAgo(profile.createdAt, locale)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {card.age}: {profile.age} |{' '}
              <span className="text-brand font-medium">{profile.kujaNumber}</span> | {card.live}:{' '}
              {profile.location}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{profile.language}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{profile.profession}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{profile.religion}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{profile.height}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {variant === 'home' || variant === 'sent' ? (
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-brand/30 flex items-center justify-center text-brand hover:bg-brand-50"
            >
              <Heart className="w-4 h-4" />
            </button>
          ) : variant === 'received' && profile.interestedBy ? (
            <>
              <div className="w-8 h-8 rounded-full border border-brand/30 flex items-center justify-center text-brand shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <p className="text-xs text-brand truncate">
                {t('interests.shownInterest', { name: profile.interestedBy })}
              </p>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onView}
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0',
          )}
        >
          {card.view}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  )
}
