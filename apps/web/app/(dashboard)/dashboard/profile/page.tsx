'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, User, Camera } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'
import { useProfileGuard } from '@/contexts/profile-guard'
import HeightSlider from '@/components/dashboard/height-slider'
import {
  NATIONALITIES, RELIGIONS, citiesForCountry, DISTRICTS,
  EDUCATION_LEVELS, PROFESSIONS, CIVIL_STATUSES,
  DRINKING_OPTS, SMOKING_OPTS, FOOD_PREFS,
} from '@/lib/options'

interface Profile {
  id: string
  firstName: string
  lastName: string
  email: string
  gender: string
  dateOfBirth: string
  avatarUrl?: string | null
  kujaNumber?: string | null
  nationality?: string | null
  height?: string | null
  ethnicity?: string | null
  caste?: string | null
  civilStatus?: string | null
  religion?: string | null
  country?: string | null
  city?: string | null
  stateDistrict?: string | null
  educationLevel?: string | null
  profession?: string | null
  drinking?: string | null
  smoking?: string | null
  foodPreference?: string | null
  birthDay?: string | null
  mobileNumber?: string | null
  whatsappNumber?: string | null
  address?: string | null
  images: string[]
  isVerified: boolean
}

interface Draft {
  firstName: string
  lastName: string
  height: string
  nationality: string
  ethnicity: string
  caste: string
  civilStatus: string
  religion: string
  country: string
  city: string
  stateDistrict: string
  educationLevel: string
  profession: string
  drinking: string
  smoking: string
  foodPreference: string
  kujaNumber: string
  birthDay: string
  mobileNumber: string
  whatsappNumber: string
  address: string
}

// Still local because they diverge from lib/options.ts:
//  - this KUJA_NUMBERS carries a trailing 'Other' the shared list does not have
//  - shared COUNTRIES drops Maldives and adds seven other countries
//  - shared ETHNICITIES uses 'Sinhala'/'Moor', but onboarding stores
//    'Sinhalese'/'Muslim' and the API's KNOWN_ETHNICITIES matches those
const KUJA_NUMBERS = ['1', '2', '4', '7', '8', '12', 'Other']
const COUNTRIES = [
  'Australia', 'Canada', 'Italy', 'Japan', 'Maldives', 'New Zealand',
  'Singapore', 'South Korea', 'Sri Lanka', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Other',
]
const ETHNICITIES = ['Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Other']

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function profileToDraft(p: Profile): Draft {
  return {
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    height: p.height ?? '',
    nationality: p.nationality ?? '',
    ethnicity: p.ethnicity ?? '',
    caste: p.caste ?? '',
    civilStatus: p.civilStatus ?? '',
    religion: p.religion ?? '',
    country: p.country ?? '',
    city: p.city ?? '',
    stateDistrict: p.stateDistrict ?? '',
    educationLevel: p.educationLevel ?? '',
    profession: p.profession ?? '',
    drinking: p.drinking ?? '',
    smoking: p.smoking ?? '',
    foodPreference: p.foodPreference ?? '',
    kujaNumber: p.kujaNumber ?? '',
    birthDay: p.birthDay ?? '',
    mobileNumber: p.mobileNumber ?? '',
    whatsappNumber: p.whatsappNumber ?? '',
    address: p.address ?? '',
  }
}

const inputCls =
  'w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors'

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm bg-gray-50 rounded-xl px-3 py-2.5 text-gray-700 min-h-[38px]">{value || '-'}</p>
    </div>
  )
}

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>
}

function FormField({ label, value, onChange, type = 'text', placeholder, required, error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; error?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
        {label}{required && <RequiredStar />}
      </p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + (error ? ' border-red-400 focus:border-red-400 focus:ring-red-200' : '')}
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required, error }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; error?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
        {label}{required && <RequiredStar />}
      </p>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={inputCls + ' appearance-none' + (error ? ' border-red-400 focus:border-red-400 focus:ring-red-200' : '')}>
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function FormDate({ label, value, onChange, required, error }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
        {label}{required && <RequiredStar />}
      </p>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        className={inputCls + (error ? ' border-red-400 focus:border-red-400 focus:ring-red-200' : '')} />
    </div>
  )
}

function Section({ title, icon, note, children }: {
  title: string; icon?: React.ReactNode; note?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-3 sm:mb-4">
      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-3 sm:mb-4">
        {icon}{title}
      </h3>
      {note && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-3 sm:mb-4 leading-relaxed">
          {note}
        </p>
      )}
      {children}
    </div>
  )
}

const REQUIRED_FIELDS: (keyof Draft)[] = [
  'firstName', 'lastName', 'mobileNumber', 'address',
  'height', 'country', 'city', 'educationLevel', 'profession',
  'kujaNumber', 'birthDay',
]

function validateDraft(draft: Draft): Partial<Record<keyof Draft, true>> {
  const errors: Partial<Record<keyof Draft, true>> = {}
  for (const f of REQUIRED_FIELDS) {
    if (!draft[f]?.trim()) errors[f] = true
  }
  return errors
}

export default function OwnProfilePage() {
  const router = useRouter()
  const { refreshStatus } = useProfileGuard()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, true>>>({})
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [resetNotice, setResetNotice] = useState('')

  useEffect(() => {
    apiFetch<Profile>('/auth/me')
      .then(p => { setProfile(p); setDraft(profileToDraft(p)) })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace('/login')
        else if (err instanceof ApiError && err.status === 404) router.replace('/onboarding')
      })
      .finally(() => setLoading(false))
  }, [router])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function handleSave() {
    if (!draft) return
    const errors = validateDraft(draft)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaveError('Please fill in all required fields marked with *')
      return
    }
    setFieldErrors({})
    setSaving(true)
    setSaveError('')
    try {
      const updated = await apiFetch<Profile>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: draft.firstName || undefined,
          lastName: draft.lastName || undefined,
          height: draft.height || undefined,
          nationality: draft.nationality || undefined,
          ethnicity: draft.ethnicity || undefined,
          caste: draft.caste || undefined,
          civilStatus: draft.civilStatus || undefined,
          religion: draft.religion || undefined,
          country: draft.country || undefined,
          city: draft.city || undefined,
          stateDistrict: draft.stateDistrict || undefined,
          educationLevel: draft.educationLevel || undefined,
          profession: draft.profession || undefined,
          drinking: draft.drinking || undefined,
          smoking: draft.smoking || undefined,
          foodPreference: draft.foodPreference || undefined,
          kujaNumber: draft.kujaNumber || undefined,
          birthDay: draft.birthDay || undefined,
          mobileNumber: draft.mobileNumber || undefined,
          whatsappNumber: draft.whatsappNumber || undefined,
          address: draft.address || undefined,
        }),
      })
      setProfile(updated)
      setDraft(profileToDraft(updated))
      refreshStatus()
      router.push('/dashboard/home')
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Discard unsaved changes?')) return
    setSaveError('')
    setFieldErrors({})
    try {
      const fresh = await apiFetch<Profile>('/auth/me')
      setProfile(fresh)
      setDraft(profileToDraft(fresh))
    } catch {
      if (profile) setDraft(profileToDraft(profile))
    }
    setResetNotice('Changes reverted')
    setTimeout(() => setResetNotice(''), 3000)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const idx = profile.images.length
    setUploadingIdx(idx)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch<{ url: string }>('/upload/image', { method: 'POST', body: fd })
      const updated = await apiFetch<Profile>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ images: [...profile.images, res.url] }),
      })
      setProfile(updated)
    } catch {
      // noop
    } finally {
      setUploadingIdx(null)
    }
  }

  async function removeImage(url: string) {
    if (!profile) return
    const updated = await apiFetch<Profile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ images: profile.images.filter(i => i !== url) }),
    })
    setProfile(updated)
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile || !draft) return null

  const cityCountry = [profile.city, profile.country].filter(Boolean).join(', ')
  const displayAvatar = profile.images?.[0] ?? profile.avatarUrl ?? null

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-32">

        {/* ── Profile header ── */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 sm:p-6 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center ring-4 ring-gray-800">
                {displayAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayAvatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 sm:w-11 sm:h-11 text-gray-500" />
                )}
              </div>
              {/* Photo count badge */}
              {profile.images.length > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-brand text-on-brand text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Camera className="w-2.5 h-2.5" />
                  {profile.images.length}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-lg sm:text-xl truncate">
                  {profile.firstName} {profile.lastName}
                </span>
                {profile.kujaNumber && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    Kuja {profile.kujaNumber}
                  </span>
                )}
                {profile.isVerified && (
                  <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-300 mt-1">
                Age {age(profile.dateOfBirth)} · {cityCountry || 'Location not set'}
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs text-gray-400 justify-center sm:justify-start">
                {profile.gender && <span className="bg-gray-800 px-2 py-0.5 rounded-full">{profile.gender}</span>}
                {profile.profession && <span className="bg-gray-800 px-2 py-0.5 rounded-full">💼 {profile.profession}</span>}
                {profile.religion && <span className="bg-gray-800 px-2 py-0.5 rounded-full">🕌 {profile.religion}</span>}
                {profile.height && <span className="bg-gray-800 px-2 py-0.5 rounded-full">📏 {profile.height}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── My Photos ── */}
        <Section
          title="My Photos"
          icon={<Lock className="w-4 h-4 text-gray-400" />}
          note="Photos are only visible to profiles you grant permission to view."
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {profile.images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-brand text-on-brand text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Main
                  </span>
                )}
                <button
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ))}
            {profile.images.length < 6 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand-light transition-colors gap-1">
                {uploadingIdx !== null ? (
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-gray-300" />
                    <span className="text-[10px] text-gray-300">Add</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingIdx !== null} />
              </label>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">{profile.images.length}/6 photos · First photo is used as your main profile picture</p>
        </Section>

        {/* ── Contact Details ── */}
        <Section
          title="Contact Details"
          icon={<Lock className="w-4 h-4 text-gray-400" />}
          note="Contact info is only visible to profiles you grant permission to view."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Mobile Number" value={draft.mobileNumber} onChange={v => set('mobileNumber', v)} placeholder="+94 77 000 0000" required error={!!fieldErrors.mobileNumber} />
            <FormField label="WhatsApp Number" value={draft.whatsappNumber} onChange={v => set('whatsappNumber', v)} placeholder="+94 77 000 0000" />
            <div className="sm:col-span-2">
              <FormField label="Address" value={draft.address} onChange={v => set('address', v)} placeholder="Street, City, Country" required error={!!fieldErrors.address} />
            </div>
          </div>
        </Section>

        {/* ── Personal Info ── */}
        <Section title="Personal Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField label="First Name" value={draft.firstName} onChange={v => set('firstName', v)} required error={!!fieldErrors.firstName} />
            <FormField label="Last Name" value={draft.lastName} onChange={v => set('lastName', v)} required error={!!fieldErrors.lastName} />
            <ReadField label="Age *" value={String(age(profile.dateOfBirth))} />
            <ReadField label="Gender *" value={profile.gender} />
            <HeightSlider value={draft.height} onChange={v => set('height', v)} required error={!!fieldErrors.height} />
            <FormSelect label="Nationality" value={draft.nationality} options={NATIONALITIES} onChange={v => set('nationality', v)} />
            <FormSelect label="Ethnicity" value={draft.ethnicity} options={ETHNICITIES} onChange={v => set('ethnicity', v)} />
            <FormField label="Caste" value={draft.caste} onChange={v => set('caste', v)} />
            <FormSelect label="Civil Status" value={draft.civilStatus} options={CIVIL_STATUSES} onChange={v => set('civilStatus', v)} />
            <FormSelect label="Religion" value={draft.religion} options={RELIGIONS} onChange={v => set('religion', v)} />
          </div>
        </Section>

        {/* ── Residency ── */}
        <Section title="Residency">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormSelect
              label="Country"
              value={draft.country}
              options={COUNTRIES}
              onChange={v => {
                // Changing country invalidates the selected city
                setDraft(prev => prev ? { ...prev, country: v, city: '' } : prev)
              }}
              required
              error={!!fieldErrors.country}
            />
            <FormSelect label="City" value={draft.city} options={citiesForCountry(draft.country)} onChange={v => set('city', v)} required error={!!fieldErrors.city} />
            <FormSelect label="State / District" value={draft.stateDistrict} options={DISTRICTS} onChange={v => set('stateDistrict', v)} />
          </div>
        </Section>

        {/* ── Education & Profession ── */}
        <Section title="Education & Profession">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect label="Education Level" value={draft.educationLevel} options={EDUCATION_LEVELS} onChange={v => set('educationLevel', v)} required error={!!fieldErrors.educationLevel} />
            <FormSelect label="Profession" value={draft.profession} options={PROFESSIONS} onChange={v => set('profession', v)} required error={!!fieldErrors.profession} />
          </div>
        </Section>

        {/* ── Habits ── */}
        <Section title="Habits">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormSelect label="Drinking" value={draft.drinking} options={DRINKING_OPTS} onChange={v => set('drinking', v)} />
            <FormSelect label="Smoking" value={draft.smoking} options={SMOKING_OPTS} onChange={v => set('smoking', v)} />
            <FormSelect label="Food Preference" value={draft.foodPreference} options={FOOD_PREFS} onChange={v => set('foodPreference', v)} />
          </div>
        </Section>

        {/* ── Horoscope ── */}
        <Section
          title="Horoscope Info"
          icon={<Lock className="w-4 h-4 text-gray-400" />}
          note="Horoscope details are only visible to profiles you grant permission to view."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormSelect label="Kuja Number" value={draft.kujaNumber} options={KUJA_NUMBERS} onChange={v => set('kujaNumber', v)} required error={!!fieldErrors.kujaNumber} />
            <FormDate label="Birth Day" value={draft.birthDay} onChange={v => set('birthDay', v)} required error={!!fieldErrors.birthDay} />
          </div>
        </Section>

      </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          {saveError
            ? <p className="flex-1 min-w-0 text-xs text-red-500">{saveError}</p>
            : resetNotice
            ? <p className="flex-1 min-w-0 text-xs text-green-600 font-medium">{resetNotice}</p>
            : <p className="flex-1 text-xs text-gray-400 hidden sm:block">Changes are saved to your profile</p>
          }
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 sm:px-6 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 sm:px-7 py-2 rounded-full bg-brand text-on-brand text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
