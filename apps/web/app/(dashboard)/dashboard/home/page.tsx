'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X, AlertCircle, ArrowRight } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import ProfileCard, { ProfileCardData } from '@/components/dashboard/profile-card'
import Link from 'next/link'

interface SearchResult {
  profiles: ProfileCardData[]
  total: number
  page: number
  totalPages: number
}

interface CurrentUser {
  id: string
  firstName: string
  isVerified: boolean
  country?: string | null
}

interface Filters {
  gender: string
  ageMin: string
  ageMax: string
  religion: string
  country: string
  city: string
  ethnicity: string
  civilStatus: string
  educationLevel: string
  drinking: string
  smoking: string
  foodPreference: string
  kujaNumber: string
}

const EMPTY_FILTERS: Filters = {
  gender: '', ageMin: '', ageMax: '', religion: '', country: '', city: '',
  ethnicity: '', civilStatus: '', educationLevel: '', drinking: '', smoking: '',
  foodPreference: '', kujaNumber: '',
}

const AGE_QUICK = [21, 22, 23, 24, 25, 26]
const CIVIL_STATUSES = ['Never Married', 'Divorced', 'Widowed', 'Separated']
const EDUCATION_LEVELS = ["Below O/L", "O/L", "A/L", "Diploma", "Bachelor's", "Master's", "PhD"]
const FOOD_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal']
const DRINKING_OPTS = ['Never', 'Occasionally', 'Regularly']
const SMOKING_OPTS = ['Never', 'Occasionally', 'Regularly']
const KUJA_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand/30 appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function FilterInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [results, setResults] = useState<ProfileCardData[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setFilter<K extends keyof Filters>(key: K, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  useEffect(() => {
    apiFetch<CurrentUser>('/auth/me')
      .then(setCurrentUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) router.replace('/onboarding')
        else if (err instanceof ApiError && err.status === 401) router.replace('/login')
      })
  }, [router])

  const search = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (f.gender) params.set('gender', f.gender)
      if (f.ageMin) params.set('ageMin', f.ageMin)
      if (f.ageMax) params.set('ageMax', f.ageMax)
      if (f.religion) params.set('religion', f.religion)
      if (f.country) params.set('country', f.country)
      if (f.city) params.set('city', f.city)
      if (f.ethnicity) params.set('ethnicity', f.ethnicity)
      if (f.civilStatus) params.set('civilStatus', f.civilStatus)
      if (f.educationLevel) params.set('educationLevel', f.educationLevel)
      if (f.drinking) params.set('drinking', f.drinking)
      if (f.smoking) params.set('smoking', f.smoking)
      if (f.foodPreference) params.set('foodPreference', f.foodPreference)
      if (f.kujaNumber) params.set('kujaNumber', f.kujaNumber)

      const data = await apiFetch<SearchResult>(`/users/search?${params}`)
      if (p === 1) setResults(data.profiles)
      else setResults(prev => [...prev, ...data.profiles])
      setTotalPages(data.totalPages)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(filters, page), 300)
  }, [filters, page, search])

  const profileIncomplete = currentUser && !currentUser.isVerified

  const filterPanel = (
    <div className="flex flex-col gap-0">
      {/* Kuja Number — pill buttons at top */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Kuja Number</p>
          {filters.kujaNumber && (
            <button onClick={() => setFilter('kujaNumber', '')} className="text-gray-300 hover:text-brand transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KUJA_NUMBERS.map(n => (
            <button
              key={n}
              onClick={() => setFilter('kujaNumber', filters.kujaNumber === n ? '' : n)}
              className={`px-2 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                filters.kujaNumber === n
                  ? 'bg-brand text-white border-brand'
                  : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
              }`}
            >
              Kuja {n}
            </button>
          ))}
        </div>
      </div>

      {/* Quick filter age tags */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Filter</p>
        <div className="flex flex-wrap gap-1.5">
          {AGE_QUICK.map(a => (
            <button
              key={a}
              onClick={() => { setFilter('ageMin', String(a)); setFilter('ageMax', String(a)) }}
              className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                filters.ageMin === String(a) && filters.ageMax === String(a)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-red-50 text-brand border-red-100 hover:bg-red-100'
              }`}
            >
              Age {a}
            </button>
          ))}
        </div>
      </div>

      {/* Looking for */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Looking For</p>
        <div className="flex gap-2">
          {[{ label: '♀ Bride', value: 'FEMALE' }, { label: '♂ Groom', value: 'MALE' }].map(g => (
            <button key={g.value} onClick={() => setFilter('gender', filters.gender === g.value ? '' : g.value)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                filters.gender === g.value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div className="mb-3">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Age Range</label>
        <div className="flex items-center gap-2">
          <input type="number" min={18} max={80} value={filters.ageMin} onChange={e => setFilter('ageMin', e.target.value)}
            placeholder="Min" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
          <span className="text-gray-300 text-xs">–</span>
          <input type="number" min={18} max={80} value={filters.ageMax} onChange={e => setFilter('ageMax', e.target.value)}
            placeholder="Max" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
        </div>
      </div>

      <FilterInput label="Country" value={filters.country} onChange={v => setFilter('country', v)} placeholder="Any" />
      <FilterInput label="City" value={filters.city} onChange={v => setFilter('city', v)} placeholder="Any" />
      <FilterInput label="Religion" value={filters.religion} onChange={v => setFilter('religion', v)} placeholder="Any" />
      <FilterInput label="Ethnicity" value={filters.ethnicity} onChange={v => setFilter('ethnicity', v)} placeholder="Any" />
      <FilterSelect label="Civil Status" value={filters.civilStatus} onChange={v => setFilter('civilStatus', v)} options={CIVIL_STATUSES} placeholder="Any" />
      <FilterInput label="Profession" value={filters.country} onChange={v => setFilter('country', v)} placeholder="Any" />
      <FilterSelect label="Education Level" value={filters.educationLevel} onChange={v => setFilter('educationLevel', v)} options={EDUCATION_LEVELS} placeholder="Any" />
      <FilterSelect label="Food Preference" value={filters.foodPreference} onChange={v => setFilter('foodPreference', v)} options={FOOD_PREFS} placeholder="Any" />
      <FilterSelect label="Drinking" value={filters.drinking} onChange={v => setFilter('drinking', v)} options={DRINKING_OPTS} placeholder="Any" />
      <FilterSelect label="Smoking" value={filters.smoking} onChange={v => setFilter('smoking', v)} options={SMOKING_OPTS} placeholder="Any" />

      <button
        onClick={() => { setFilters(EMPTY_FILTERS); setPage(1) }}
        className="mt-2 text-xs text-gray-400 hover:text-brand transition-colors text-left"
      >
        Reset all filters
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-white border-r border-gray-100 h-full overflow-y-auto shrink-0 p-4">
        {filterPanel}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 bg-white h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Filters</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {filterPanel}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full p-4 sm:p-6">

          {/* Incomplete profile banner */}
          {profileIncomplete && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Complete your profile</p>
                  <p className="text-xs text-amber-600 mt-0.5">Your profile is incomplete. Finish setting it up to increase your chances of finding the right partner.</p>
                </div>
              </div>
              <Link href="/dashboard/profile" className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0">
                Set Up Profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">Sort By:</span>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">No profiles found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(p => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>

              {page < totalPages && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loading}
                    className="px-6 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
