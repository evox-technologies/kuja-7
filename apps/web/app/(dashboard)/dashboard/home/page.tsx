'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, AlertCircle, ArrowRight } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import ProfileCard, { ProfileCardData } from '@/components/dashboard/profile-card'
import Link from 'next/link'
import { HEIGHT_MIN_IN, HEIGHT_MAX_IN, formatHeight } from '@/lib/height'
import { useI18n } from '@/lib/i18n/use-i18n'
import {
  COUNTRIES, citiesForCountry, RELIGIONS, ETHNICITIES, PROFESSIONS,
  CIVIL_STATUSES, EDUCATION_LEVELS, FOOD_PREFS, DRINKING_OPTS, SMOKING_OPTS,
  KUJA_NUMBERS, MIN_AGE, MAX_AGE,
} from '@/lib/options'

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
  heightMin: string
  heightMax: string
  religion: string
  country: string
  city: string
  ethnicity: string
  civilStatus: string
  educationLevel: string
  profession: string
  drinking: string
  smoking: string
  foodPreference: string
  kujaNumber: string
  sort: string
}

const EMPTY_FILTERS: Filters = {
  gender: '', ageMin: '', ageMax: '', heightMin: '', heightMax: '',
  religion: '', country: '', city: '',
  ethnicity: '', civilStatus: '', educationLevel: '', profession: '',
  drinking: '', smoking: '', foodPreference: '', kujaNumber: '', sort: '',
}

function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-border appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function HeightRangeFilter({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  label: string
  min: string
  max: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
}) {
  const minIn = min ? Number(min) : HEIGHT_MIN_IN
  const maxIn = max ? Number(max) : HEIGHT_MAX_IN

  function setMin(next: number) {
    const clamped = Math.min(next, maxIn)
    onMinChange(String(clamped))
    if (!max) onMaxChange(String(HEIGHT_MAX_IN))
  }

  function setMax(next: number) {
    const clamped = Math.max(next, minIn)
    onMaxChange(String(clamped))
    if (!min) onMinChange(String(HEIGHT_MIN_IN))
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-xs font-semibold text-gray-800 tabular-nums">
          {formatHeight(minIn)} – {formatHeight(maxIn)}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{
            left: `${((minIn - HEIGHT_MIN_IN) / (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) * 100}%`,
            right: `${((HEIGHT_MAX_IN - maxIn) / (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={HEIGHT_MIN_IN}
          max={HEIGHT_MAX_IN}
          step={1}
          value={minIn}
          onChange={e => setMin(Number(e.target.value))}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none z-[1] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
          aria-label="Minimum height"
        />
        <input
          type="range"
          min={HEIGHT_MIN_IN}
          max={HEIGHT_MAX_IN}
          step={1}
          value={maxIn}
          onChange={e => setMax(Number(e.target.value))}
          className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none z-[2] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
          aria-label="Maximum height"
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatHeight(HEIGHT_MIN_IN)}</span>
        <span>{formatHeight(HEIGHT_MAX_IN)}</span>
      </div>
    </div>
  )
}

function HomePageInner() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_FILTERS,
    gender: searchParams.get('gender') ?? '',
    ageMin: searchParams.get('ageMin') ?? '',
    ageMax: searchParams.get('ageMax') ?? '',
  }))
  const [results, setResults] = useState<ProfileCardData[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
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
        // A 404 means a signed-in user with no profile row yet — send them to onboarding.
        // A 401 (no session) just means an anonymous visitor browsing Home — let them.
        if (err instanceof ApiError && err.status === 404) router.replace('/onboarding')
      })
  }, [router])

  const search = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (f.gender) params.set('gender', f.gender)
      if (f.ageMin) params.set('ageMin', f.ageMin)
      if (f.ageMax) params.set('ageMax', f.ageMax)
      if (f.heightMin) params.set('heightMin', f.heightMin)
      if (f.heightMax) params.set('heightMax', f.heightMax)
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
      if (f.profession) params.set('profession', f.profession)
      if (f.sort) params.set('sort', f.sort)

      const data = await apiFetch<SearchResult>(`/users/search?${params}`)
      if (p === 1) setResults(data.profiles)
      else setResults(prev => [...prev, ...data.profiles])
      setTotalPages(data.totalPages)
      setSearchError(false)
    } catch {
      setSearchError(true)
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
      {/* Kuja Number — card with grid buttons */}
      <div className="mb-4 rounded-2xl overflow-hidden bg-brand">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <p className="text-sm font-bold text-on-brand tracking-wide">{t('dashboard.filters.kujaNumber')}</p>
          <div className="flex items-center gap-2">
            {filters.kujaNumber && (
              <button onClick={() => setFilter('kujaNumber', '')} className="text-on-brand/70 hover:text-on-brand transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-5 h-5 rounded-full border border-on-brand/50 flex items-center justify-center">
              <span className="text-on-brand text-[10px] font-bold">i</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {KUJA_NUMBERS.map(n => (
            <button
              key={n}
              onClick={() => setFilter('kujaNumber', filters.kujaNumber === n ? '' : n)}
              className={`flex flex-col items-center justify-center py-3 rounded-xl font-bold transition-all ${
                filters.kujaNumber === n
                  ? 'bg-on-brand/20 text-on-brand border-2 border-on-brand'
                  : 'bg-white text-brand-text border-2 border-transparent hover:bg-brand-light'
              }`}
            >
              <span className="text-[10px] font-semibold tracking-wide">Kuja</span>
              <span className="text-xl font-black leading-tight">
                {n.padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick filter age tags
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Filter</p>
        <div className="flex flex-wrap gap-1.5">
          {AGE_QUICK.map(a => (
            <button
              key={a}
              onClick={() => { setFilter('ageMin', String(a)); setFilter('ageMax', String(a)) }}
              className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                filters.ageMin === String(a) && filters.ageMax === String(a)
                  ? 'bg-brand text-on-brand border-brand'
                  : 'bg-red-50 text-brand border-red-100 hover:bg-red-100'
              }`}
            >
              Age {a}
            </button>
          ))}
        </div>
      </div> */}

      {/* Looking for */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('dashboard.filters.lookingFor')}</p>
        <div className="flex gap-2">
          {[{ label: t('dashboard.filters.bride'), value: 'FEMALE' }, { label: t('dashboard.filters.groom'), value: 'MALE' }].map(g => (
            <button key={g.value} onClick={() => setFilter('gender', filters.gender === g.value ? '' : g.value)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                filters.gender === g.value ? 'border-brand bg-brand-light text-brand-text' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div className="mb-3">
        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('dashboard.filters.ageRange')}</label>
        <div className="flex items-center gap-2">
          <input type="number" min={MIN_AGE} max={MAX_AGE} value={filters.ageMin} onChange={e => setFilter('ageMin', e.target.value)}
            placeholder={t('dashboard.filters.min')} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
          <span className="text-gray-300 text-xs">–</span>
          <input type="number" min={MIN_AGE} max={MAX_AGE} value={filters.ageMax} onChange={e => setFilter('ageMax', e.target.value)}
            placeholder={t('dashboard.filters.max')} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
        </div>
      </div>

      <HeightRangeFilter
        label={t('dashboard.filters.height')}
        min={filters.heightMin}
        max={filters.heightMax}
        onMinChange={v => setFilter('heightMin', v)}
        onMaxChange={v => setFilter('heightMax', v)}
      />

      <FilterSelect
        label={t('dashboard.filters.country')}
        value={filters.country}
        onChange={v => {
          // Changing country invalidates the selected city
          setFilters(prev => ({ ...prev, country: v, city: '' }))
          setPage(1)
        }}
        options={COUNTRIES}
        placeholder={t('dashboard.filters.any')}
      />
      <FilterSelect label={t('dashboard.filters.city')} value={filters.city} onChange={v => setFilter('city', v)} options={citiesForCountry(filters.country)} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.religion')} value={filters.religion} onChange={v => setFilter('religion', v)} options={RELIGIONS} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.ethnicity')} value={filters.ethnicity} onChange={v => setFilter('ethnicity', v)} options={ETHNICITIES} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.civilStatus')} value={filters.civilStatus} onChange={v => setFilter('civilStatus', v)} options={CIVIL_STATUSES} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.profession')} value={filters.profession} onChange={v => setFilter('profession', v)} options={PROFESSIONS} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.educationLevel')} value={filters.educationLevel} onChange={v => setFilter('educationLevel', v)} options={EDUCATION_LEVELS} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.foodPreference')} value={filters.foodPreference} onChange={v => setFilter('foodPreference', v)} options={FOOD_PREFS} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.drinking')} value={filters.drinking} onChange={v => setFilter('drinking', v)} options={DRINKING_OPTS} placeholder={t('dashboard.filters.any')} />
      <FilterSelect label={t('dashboard.filters.smoking')} value={filters.smoking} onChange={v => setFilter('smoking', v)} options={SMOKING_OPTS} placeholder={t('dashboard.filters.any')} />

      <button
        onClick={() => {
          setFilters({ ...EMPTY_FILTERS })
          setPage(1)
          router.replace('/dashboard/home')
        }}
        className="mt-2 text-xs text-gray-400 hover:text-brand transition-colors text-left"
      >
        {t('dashboard.filters.reset')}
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
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full overflow-y-auto p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">{t('dashboard.filters.title')}</span>
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
                  <p className="font-semibold text-amber-800 text-sm">{t('dashboard.completeProfileTitle')}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{t('dashboard.completeProfileBody')}</p>
                </div>
              </div>
              <Link href="/dashboard/profile" className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0">
                {t('dashboard.setUpProfile')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('dashboard.filters.title')}
            </button>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">{t('dashboard.sortBy')}</span>
              <select
                value={filters.sort || 'newest'}
                onChange={e => setFilter('sort', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
              >
                <option value="newest">{t('dashboard.newestFirst')}</option>
                <option value="oldest">{t('dashboard.oldestFirst')}</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchError ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">{t('dashboard.searchFailed')}</p>
              <button
                onClick={() => search(filters, page)}
                className="mt-3 px-5 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-brand hover:text-brand transition-colors"
              >
                {t('dashboard.retry')}
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">{t('dashboard.noProfiles')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {loading ? t('dashboard.loading') : t('dashboard.loadMore')}
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomePageInner />
    </Suspense>
  )
}
