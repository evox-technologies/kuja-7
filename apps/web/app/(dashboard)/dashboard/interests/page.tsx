'use client'

import { useEffect, useMemo, useState } from 'react'
import ProfileCard from '@/components/dashboard/home/profile-card'
import RegisterUserGuard from '@/components/dashboard/register-user-guard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchMockProfiles, type MockProfile } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { cn } from '@/lib/utils'

export default function InterestsPage() {
  return (
    <RegisterUserGuard>
      <InterestsPageContent />
    </RegisterUserGuard>
  )
}

function InterestsPageContent() {
  const { messages } = useI18n()
  const [profiles, setProfiles] = useState<MockProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    fetchMockProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return profiles
      .filter((p) => p.interestType === tab)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [profiles, tab])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex rounded-full bg-gray-100 p-0.5">
          {(['sent', 'received'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-full transition-colors',
                tab === key ? 'bg-gray-900 text-white' : 'text-gray-500',
              )}
            >
              {messages.interests[key]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{messages.interests.sortBy}</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-8 w-auto min-w-[9rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{messages.interests.newestFirst}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">{messages.interests.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            {filtered.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                variant={tab}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
