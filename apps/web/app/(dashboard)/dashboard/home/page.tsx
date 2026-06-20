'use client'

import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import FilterSidebar, { DEFAULT_FILTERS, type FilterState } from '@/components/dashboard/home/filter-sidebar'
import ProfileCard from '@/components/dashboard/home/profile-card'
import Sheet from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchMockProfiles, type MockProfile } from '@/lib/profile/types'
import { useI18n } from '@/lib/i18n/use-i18n'
import { cn } from '@/lib/utils'

function applyFilters(profiles: MockProfile[], filters: FilterState) {
  return profiles.filter((p) => {
    if (filters.lookingFor && p.gender !== filters.lookingFor) return false
    if (filters.ageMin && p.age < Number(filters.ageMin)) return false
    if (filters.ageMax && p.age > Number(filters.ageMax)) return false
    return true
  })
}

export default function HomePage() {
  const { messages, t } = useI18n()
  const [profiles, setProfiles] = useState<MockProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [tab, setTab] = useState<'new' | 'interests'>('new')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    fetchMockProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = applyFilters(
      profiles.filter((p) => !p.interestType && p.interestStatus !== 'accepted'),
      filters,
    )
    if (tab === 'interests') {
      list = profiles.filter((p) => p.interestType === 'sent' || p.interestType === 'received')
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [profiles, filters, tab])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="sr-only">{messages.home.loading}</span>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className="hidden lg:block w-64 xl:w-72 shrink-0 border-r border-gray-100 bg-white overflow-y-auto p-4">
        <FilterSidebar filters={filters} onChange={setFilters} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="lg:hidden flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-1.5"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('dashboard.filters')}
            </button>
            <div className="flex rounded-full bg-gray-100 p-0.5">
              {(['new', 'interests'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    tab === key ? 'bg-gray-900 text-white' : 'text-gray-500',
                  )}
                >
                  {messages.home.tabs[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 w-auto min-w-[8rem] text-xs border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{messages.home.sort.recent}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">{messages.home.empty}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} variant="home" />
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t('dashboard.filters')}>
        <div className="p-4">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>
      </Sheet>
    </div>
  )
}
