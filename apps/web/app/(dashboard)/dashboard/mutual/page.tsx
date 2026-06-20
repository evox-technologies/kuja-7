'use client'

import { useEffect, useMemo, useState } from 'react'
import ProfileCard from '@/components/dashboard/home/profile-card'
import RegisterUserGuard from '@/components/dashboard/register-user-guard'
import { fetchMockProfiles, type MockProfile } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'

export default function MutualPage() {
  return (
    <RegisterUserGuard>
      <MutualPageContent />
    </RegisterUserGuard>
  )
}

function MutualPageContent() {
  const { messages } = useI18n()
  const [profiles, setProfiles] = useState<MockProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMockProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const mutual = useMemo(
    () => profiles.filter((p) => p.interestStatus === 'accepted'),
    [profiles],
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">{messages.mutual.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mutual.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">{messages.mutual.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mutual.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} variant="mutual" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
