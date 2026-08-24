'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { apiFetch, ApiError } from '@/lib/api'
import { ChevronLeft, Lock, Info, Minus, Plus } from 'lucide-react'
import {
  HEIGHT_MIN_IN,
  HEIGHT_MAX_IN,
  HEIGHT_DEFAULT_IN,
  formatHeight,
  heightToInches,
} from '@/lib/height'
import {
  citiesForCountry,
  districtsForCountry,
  KUJA_NUMBERS,
  KUJA_OTHER,
  MIN_AGE,
  PHONE_COUNTRY_CODES,
  formatPhone,
  phoneDigits,
  validatePhone,
} from '@/lib/options'

type Step = 1 | 2 | 3 | 'preview'

interface FormData {
  // Step 1 – Basic Details
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  gender: 'MALE' | 'FEMALE' | ''
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
  // Step 2 – Horoscope
  kujaNumber: string
  birthDay: string
  // Step 3 – Private Data
  mobileNumber: string
  whatsappNumber: string
  height: string  
  address: string
  images: string[]
}

const EMPTY: FormData = {
  firstName: '', lastName: '', dateOfBirth: '', nationality: '', height: formatHeight(HEIGHT_DEFAULT_IN),
  gender: '', ethnicity: '', caste: '', civilStatus: '', religion: '',
  country: '', city: '', stateDistrict: '',
  educationLevel: '', profession: '', drinking: '', smoking: '', foodPreference: '',
  kujaNumber: '', birthDay: '',
  mobileNumber: '', whatsappNumber: '', address: '', images: [],
}

const NATIONALITIES = [
  'Sri Lankan',
  'Indian',
  'Bangladeshi',
  'Pakistani',
  'Nepali',
  'Maldivian',
  'Chinese',
  'Japanese',
  'Korean',
  'British',
  'American',
  'Australian',
  'Canadian',
  'German',
  'French',
  'Italian',
  'Other',
]
const COUNTRIES = [
  'Australia', 'Canada', 'Italy', 'Japan', 'Maldives', 'New Zealand',
  'Singapore', 'South Korea', 'Sri Lanka', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Other',
]
const ETHNICITIES = ['Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Other']
const CASTE_GROUPS: { label: string; options: string[] }[] = [
  {
    label: 'Sinhala caste categories',
    options: [
      'Govigama',
      'Karava',
      'Salagama',
      'Durava',
      'Wahumpura / Hakuru',
      'Berava',
      'Navandanna',
      'Bathgama',
      'Rodi',
      'Achari',
      'Kumbal',
      'Hunu',
      'Panna',
      'Dewa',
      'Oli',
      'Nakatti',
      'Radha',
      'Vahumpura',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    label: 'Sri Lankan Tamil caste categories',
    options: [
      'Vellalar',
      'Karaiyar',
      'Koviyar',
      'Nalavar',
      'Pallar',
      'Paraiyar',
      'Mukkuvar',
      'Maravar',
      'Agamudaiyar',
      'Chettiar',
      'Brahmin',
      'Pandaram',
      'Vannar',
      'Ambattar',
      'Navithar',
      'Dhobi',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    label: 'Malaiyaha / Indian Tamil communities',
    options: [
      'Pallar',
      'Paraiyar',
      'Vellalar',
      'Kallar',
      'Maravar',
      'Agamudaiyar',
      'Naidu',
      'Chettiar',
      'Brahmin',
      'Other',
      'Prefer not to say',
    ],
  },
]

function casteOptionValue(groupLabel: string, option: string) {
  return `${groupLabel}::${option}`
}

function casteOptionName(selection: string) {
  const i = selection.indexOf('::')
  return i === -1 ? selection : selection.slice(i + 2)
}

const CIVIL_STATUSES = ['Never Married', 'Divorced', 'Widowed', 'Separated']
const RELIGIONS = [
  'Buddhism',
  'Hinduism',
  'Islam',
  'Roman Catholic',
  'Other Christian',
  'Other',
]
const EDUCATION_LEVELS = [
  'Up to GCE O/L',
  'Up to GCE A/L',
  'Diploma',
  'Professional Qualification',
  'Undergraduate',
  "Bachelor's Degree or Equivalent",
  'Post Graduate Diploma',
  "Master's Degree or Equivalent",
  'Phd or Post Doctoral',
]
const PROFESSIONS = [
  'Student',
  'Software Engineer / IT',
  'Doctor / Healthcare',
  'Engineer',
  'Teacher / Lecturer',
  'Accountant / Finance',
  'Lawyer',
  'Government Employee',
  'Private Sector Employee',
  'Business Owner / Entrepreneur',
  'Banker',
  'Marketing / Sales',
  'Armed Forces / Police',
  'Farmer / Agriculture',
  'Driver / Transport',
  'Self-Employed',
  'Retired',
  'Unemployed',
  'Other',
]
const FOOD_PREFS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal']
const DRINKING_OPTS = ['Never', 'Occasionally', 'Regularly']
const SMOKING_OPTS = ['Never', 'Occasionally', 'Regularly']

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function maxAdultBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return isoDate(d)
}

function isAtLeast18(dateStr: string): boolean {
  return !!dateStr && dateStr <= maxAdultBirthDate()
}

function toIso8601Date(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return `${dateStr}T00:00:00.000Z`
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toISOString()
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { message?: string | string[] }
      if (typeof parsed.message === 'string') return parsed.message
      if (Array.isArray(parsed.message)) return parsed.message.join(', ')
    } catch {
      if (err.message) return err.message
    }
  }
  return 'Image upload failed'
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', min, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; min?: string; max?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors"
    />
  )
}

function PhoneInput({ code, local, onCodeChange, onLocalChange, error }: {
  code: string
  local: string
  onCodeChange: (code: string) => void
  onLocalChange: (local: string) => void
  error?: string
}) {
  const meta = PHONE_COUNTRY_CODES.find(c => c.code === code)
  return (
    <div>
      <div className={`flex rounded-xl border bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-brand-border ${
        error ? 'border-red-400' : 'border-gray-200 focus-within:border-brand'
      }`}>
        <select
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          className="w-[6.75rem] shrink-0 px-2 py-2 text-sm bg-gray-50 border-r border-gray-200 focus:outline-none appearance-none"
          aria-label="Country code"
        >
          {PHONE_COUNTRY_CODES.map(c => (
            <option key={c.label} value={c.code}>{c.label}</option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={local}
          onChange={e => onLocalChange(phoneDigits(e.target.value))}
          placeholder={meta?.placeholder ?? 'Phone number'}
          maxLength={meta ? meta.max : 15}
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-50 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SelectInput({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors appearance-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function GroupedSelectInput({ value, onChange, groups, placeholder }: {
  value: string
  onChange: (v: string) => void
  groups: { label: string; options: string[] }[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors appearance-none"
    >
      <option value="">{placeholder}</option>
      {groups.map(g => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map(o => (
            <option key={`${g.label}-${o}`} value={casteOptionValue(g.label, o)}>{o}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function HeightStepper({ value, onChange }: {
  value: string; onChange: (v: string) => void
}) {
  const inches = heightToInches(value)
  const display = formatHeight(inches)

  function step(delta: number) {
    onChange(formatHeight(inches + delta))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={inches <= HEIGHT_MIN_IN}
        aria-label="Decrease height by 1 inch"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div
        className="flex-1 px-3 py-2 text-sm font-medium text-center text-gray-800 border border-gray-200 rounded-xl bg-gray-50 tabular-nums"
        aria-live="polite"
      >
        {display}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={inches >= HEIGHT_MAX_IN}
        aria-label="Increase height by 1 inch"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

function PrivacyBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700 mb-4">
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  )
}

function SectionCard({ title, icon, children, onEdit }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; onEdit?: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          {icon}
          {title}
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-xs text-brand-text font-medium hover:text-brand hover:underline">
            ✏ Edit
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function PreviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">{value || '-'}</p>
    </div>
  )
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6 sm:mb-8">
      {([1, 2, 3] as const).map((n, i) => (
        <div key={n} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
            n < current ? 'bg-brand border-brand text-on-brand' :
            n === current ? 'bg-gray-900 border-gray-900 text-white' :
            'bg-white border-gray-200 text-gray-400'
          }`}>{n}</div>
          {i < 2 && <div className={`w-12 sm:w-20 h-0.5 ${n < current ? 'bg-brand' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [countrySelection, setCountrySelection] = useState('')
  const [citySelection, setCitySelection] = useState('')
  const [districtSelection, setDistrictSelection] = useState('')
  const [ethnicitySelection, setEthnicitySelection] = useState('')
  const [nationalitySelection, setNationalitySelection] = useState('')
  const [casteSelection, setCasteSelection] = useState('')
  const [religionSelection, setReligionSelection] = useState('')
  const [professionSelection, setProfessionSelection] = useState('')
  const [mobileCode, setMobileCode] = useState('+94')
  const [mobileLocal, setMobileLocal] = useState('')
  const [whatsappCode, setWhatsappCode] = useState('+94')
  const [whatsappLocal, setWhatsappLocal] = useState('')
  const [phoneErrors, setPhoneErrors] = useState({ mobile: '', whatsapp: '' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setEmail(session.user.email ?? '')
    })
  }, [router])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function setMobile(code: string, local: string) {
    setMobileCode(code)
    setMobileLocal(local)
    set('mobileNumber', formatPhone(code, local))
    setPhoneErrors(prev => ({ ...prev, mobile: '' }))
  }

  function setWhatsapp(code: string, local: string) {
    setWhatsappCode(code)
    setWhatsappLocal(local)
    set('whatsappNumber', formatPhone(code, local))
    setPhoneErrors(prev => ({ ...prev, whatsapp: '' }))
  }

  function validatePhones() {
    const mobile = validatePhone(mobileCode, mobileLocal, 'Mobile number') ?? ''
    const whatsapp = validatePhone(whatsappCode, whatsappLocal, 'WhatsApp number') ?? ''
    setPhoneErrors({ mobile, whatsapp })
    return !mobile && !whatsapp
  }

  function validateStep1() {
    if (!form.firstName.trim()) return 'First name is required'
    if (!form.lastName.trim()) return 'Last name is required'
    if (!form.dateOfBirth) return 'Date of birth is required'
    if (!isAtLeast18(form.dateOfBirth)) return `You must be at least ${MIN_AGE} years old`
    if (!form.gender) return 'Gender is required'
    return null
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (file.type && !allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB')
      return
    }

    const idx = form.images.length
    setUploadingIdx(idx)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch<{ url: string }>('/upload/image', { method: 'POST', body: fd })
      set('images', [...form.images, res.url])
    } catch (err: unknown) {
      setError(uploadErrorMessage(err))
    } finally {
      setUploadingIdx(null)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    if (form.birthDay && !isAtLeast18(form.birthDay)) {
      setError(`You must be at least ${MIN_AGE} years old`)
      setLoading(false)
      return
    }
    if (!validatePhones()) {
      setLoading(false)
      return
    }
    try {
      const dobSource = form.dateOfBirth || form.birthDay
      if (!dobSource || !isAtLeast18(dobSource)) {
        setError(`You must be at least ${MIN_AGE} years old`)
        setLoading(false)
        return
      }
      const location = [form.city, form.stateDistrict, form.country].filter(Boolean).join(', ')
      await apiFetch('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email,
          gender: form.gender,
          dateOfBirth: toIso8601Date(dobSource),
          nationality: form.nationality || undefined,
          ethnicity: form.ethnicity || undefined,
          caste: form.caste || undefined,
          civilStatus: form.civilStatus || undefined,
          religion: form.religion || undefined,
          height: form.height || undefined,
          country: form.country || undefined,
          city: form.city || undefined,
          stateDistrict: form.stateDistrict || undefined,
          educationLevel: form.educationLevel || undefined,
          profession: form.profession || undefined,
          drinking: form.drinking || undefined,
          smoking: form.smoking || undefined,
          foodPreference: form.foodPreference || undefined,
          kujaNumber: form.kujaNumber || undefined,
          birthDay: form.birthDay || undefined,
          mobileNumber: form.mobileNumber || undefined,
          whatsappNumber: form.whatsappNumber || undefined,
          address: form.address || undefined,
          images: form.images.length ? form.images : undefined,
          location: location || undefined,
        }),
      })
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const header = (
    <div className="text-center mb-6">
      <p className="text-xs text-gray-400 mb-1">Kuja7.lk</p>
      <h1 className="text-2xl font-bold text-brand">Create Your Profile</h1>
    </div>
  )

  if (step === 1) {
    const err = error
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
          {header}
          <StepIndicator current={1} />
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 space-y-6">

            {/* Personal Info */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-4">Personal Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="First Name *">
                  <TextInput value={form.firstName} onChange={v => set('firstName', v)} placeholder="First name" />
                </FieldGroup>
                <FieldGroup label="Last Name *">
                  <TextInput value={form.lastName} onChange={v => set('lastName', v)} placeholder="Last name" />
                </FieldGroup>
                <FieldGroup label="Date of Birth *">
                  <TextInput
                    type="date"
                    value={form.dateOfBirth}
                    onChange={v => set('dateOfBirth', v)}
                    max={maxAdultBirthDate()}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">You must be at least {MIN_AGE} years old</p>
                </FieldGroup> 
                <FieldGroup label="Nationality">
                  <SelectInput
                    value={nationalitySelection}
                    onChange={v => {
                      setNationalitySelection(v)
                      set('nationality', v === 'Other' ? '' : v)
                    }}
                    options={NATIONALITIES}
                    placeholder="Select Nationality"
                  />
                  {nationalitySelection === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.nationality} onChange={v => set('nationality', v)} placeholder="Enter your nationality" />
                    </div>
                  )}
                </FieldGroup>
                <FieldGroup label="Gender *">
                  <div className="grid grid-cols-2 gap-2">
                    {(['MALE', 'FEMALE'] as const).map(g => (
                      <button key={g} type="button" onClick={() => set('gender', g)}
                        className={`py-2 rounded-xl border text-sm font-medium transition-colors ${
                          form.gender === g ? 'border-brand bg-brand-light text-brand-text' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        {g === 'MALE' ? '♂ Male' : '♀ Female'}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
                <FieldGroup label="Ethnicity">
                  <SelectInput
                    value={ethnicitySelection}
                    onChange={v => {
                      setEthnicitySelection(v)
                      set('ethnicity', v === 'Other' ? '' : v)
                    }}
                    options={ETHNICITIES}
                    placeholder="Select Ethnicity"
                  />
                  {ethnicitySelection === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.ethnicity} onChange={v => set('ethnicity', v)} placeholder="Enter your ethnicity" />
                    </div>
                  )}
                </FieldGroup>
                <FieldGroup label="Caste">
                  <GroupedSelectInput
                    value={casteSelection}
                    onChange={v => {
                      setCasteSelection(v)
                      const name = casteOptionName(v)
                      set('caste', name === 'Other' ? '' : name)
                    }}
                    groups={CASTE_GROUPS}
                    placeholder="Select Caste"
                  />
                  {casteOptionName(casteSelection) === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.caste} onChange={v => set('caste', v)} placeholder="Enter your caste" />
                    </div>
                  )}
                </FieldGroup>
                <FieldGroup label="Civil Status">
                  <SelectInput value={form.civilStatus} onChange={v => set('civilStatus', v)} options={CIVIL_STATUSES} placeholder="Choose Civil Status" />
                </FieldGroup>
                <FieldGroup label="Religion">
                  <SelectInput
                    value={religionSelection}
                    onChange={v => {
                      setReligionSelection(v)
                      set('religion', v === 'Other' ? '' : v)
                    }}
                    options={RELIGIONS}
                    placeholder="Select Religion"
                  />
                  {religionSelection === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.religion} onChange={v => set('religion', v)} placeholder="Enter your religion" />
                    </div>
                  )}
                </FieldGroup>
                <FieldGroup label="Height">
                  <HeightStepper value={form.height} onChange={v => set('height', v)} />
                </FieldGroup>
                
              </div>
            </div>

            {/* Residency */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-4">Residency</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldGroup label="Country">
                  <SelectInput
                    value={countrySelection}
                    onChange={v => {
                      setCountrySelection(v)
                      set('country', v === 'Other' ? '' : v)
                      setCitySelection('')
                      set('city', '')
                      setDistrictSelection('')
                      set('stateDistrict', '')
                    }}
                    options={COUNTRIES}
                    placeholder="Select Country"
                  />
                  {countrySelection === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.country} onChange={v => set('country', v)} placeholder="Enter your country" />
                    </div>
                  )}
                </FieldGroup>
                <FieldGroup label="City">
                  {countrySelection === 'Other' ? (
                    <TextInput value={form.city} onChange={v => set('city', v)} placeholder="City" />
                  ) : (
                    <>
                      <SelectInput
                        value={citySelection}
                        onChange={v => {
                          setCitySelection(v)
                          set('city', v === 'Other' ? '' : v)
                        }}
                        options={countrySelection ? citiesForCountry(form.country) : []}
                        placeholder={countrySelection ? 'Select City' : 'Select a country first'}
                        disabled={!countrySelection}
                      />
                      {citySelection === 'Other' && (
                        <div className="mt-2">
                          <TextInput value={form.city} onChange={v => set('city', v)} placeholder="Enter your city" />
                        </div>
                      )}
                    </>
                  )}
                </FieldGroup>
                <FieldGroup label="State / District">
                  {countrySelection === 'Other' ? (
                    <TextInput value={form.stateDistrict} onChange={v => set('stateDistrict', v)} placeholder="District" />
                  ) : (
                    <>
                      <SelectInput
                        value={districtSelection}
                        onChange={v => {
                          setDistrictSelection(v)
                          set('stateDistrict', v === 'Other' ? '' : v)
                        }}
                        options={countrySelection ? districtsForCountry(form.country) : []}
                        placeholder={countrySelection ? 'Select State / District' : 'Select a country first'}
                        disabled={!countrySelection}
                      />
                      {districtSelection === 'Other' && (
                        <div className="mt-2">
                          <TextInput value={form.stateDistrict} onChange={v => set('stateDistrict', v)} placeholder="Enter your state or district" />
                        </div>
                      )}
                    </>
                  )}
                </FieldGroup>
              </div>
            </div>

            {/* Education & Profession */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-4">Education &amp; Profession</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Education Level">
                  <SelectInput value={form.educationLevel} onChange={v => set('educationLevel', v)} options={EDUCATION_LEVELS} placeholder="Choose Education Level" />
                </FieldGroup>
                <FieldGroup label="Profession">
                  <SelectInput
                    value={professionSelection}
                    onChange={v => {
                      setProfessionSelection(v)
                      set('profession', v === 'Other' ? '' : v)
                    }}
                    options={PROFESSIONS}
                    placeholder="Select Profession"
                  />
                  {professionSelection === 'Other' && (
                    <div className="mt-2">
                      <TextInput value={form.profession} onChange={v => set('profession', v)} placeholder="Enter your profession" />
                    </div>
                  )}
                </FieldGroup>
              </div>
            </div>

            {/* Habits */}
            <div>
              <h2 className="font-semibold text-gray-800 mb-4">Habits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldGroup label="Drinking">
                  <SelectInput value={form.drinking} onChange={v => set('drinking', v)} options={DRINKING_OPTS} placeholder="Choose" />
                </FieldGroup>
                <FieldGroup label="Smoking">
                  <SelectInput value={form.smoking} onChange={v => set('smoking', v)} options={SMOKING_OPTS} placeholder="Choose" />
                </FieldGroup>
                <FieldGroup label="Food Preference">
                  <SelectInput value={form.foodPreference} onChange={v => set('foodPreference', v)} options={FOOD_PREFS} placeholder="Choose" />
                </FieldGroup>
              </div>
            </div>

            {err && <p className="text-xs text-red-500">{err}</p>}

            <button onClick={() => {
              const e = validateStep1(); if (e) { setError(e); return }
              setError(''); setStep(2)
            }} className="w-full py-3 rounded-full bg-brand text-on-brand font-semibold text-sm hover:opacity-90 transition-opacity">
              Save &amp; Continue →
            </button>
          </div>
      </div>
    )
  }

  if (step === 2) return (
    <div className="max-w-xl mx-auto px-4 py-8">
        {header}
        <StepIndicator current={2} />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Horoscope Info <Lock className="w-4 h-4 text-gray-400" />
          </h2>
          <PrivacyBanner text="Private information such as pictures, contact details and horoscope information are only visible to matched profiles." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Kuja Number">
              <select
                value={form.kujaNumber}
                onChange={e => set('kujaNumber', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-border focus:border-brand transition-colors appearance-none"
              >
                <option value="">-</option>
                {KUJA_NUMBERS.map(n => (
                  <option key={n} value={n}>{n === KUJA_OTHER ? 'Other' : `Kuja ${n}`}</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Birth Day">
              <TextInput
                type="date"
                value={form.birthDay}
                onChange={v => {
                  setError('')
                  set('birthDay', v)
                }}
                max={maxAdultBirthDate()}
              />
              <p className="text-[10px] text-gray-400 mt-1">You must be at least {MIN_AGE} years old</p>
            </FieldGroup>
          </div>
          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 sm:mr-auto">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => {
              if (form.birthDay && !isAtLeast18(form.birthDay)) {
                setError(`You must be at least ${MIN_AGE} years old`)
                return
              }
              setError('')
              setStep(3)
            }} className="px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Skip
            </button>
            <button onClick={() => {
              if (form.birthDay && !isAtLeast18(form.birthDay)) {
                setError(`You must be at least ${MIN_AGE} years old`)
                return
              }
              setError('')
              setStep(3)
            }} className="flex-1 py-2.5 rounded-full bg-brand text-on-brand font-semibold text-sm hover:opacity-90 transition-opacity">
              Save &amp; Continue →
            </button>
          </div>
        </div>
    </div>
  )

  if (step === 3) return (
    <div className="max-w-xl mx-auto px-4 py-8">
        {header}
        <StepIndicator current={3} />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 space-y-6">

          <div>
            <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              Contact Details <Lock className="w-4 h-4 text-gray-400" />
            </h2>
            <PrivacyBanner text="Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Mobile Number">
                <PhoneInput
                  code={mobileCode}
                  local={mobileLocal}
                  onCodeChange={c => setMobile(c, mobileLocal)}
                  onLocalChange={n => setMobile(mobileCode, n)}
                  error={phoneErrors.mobile}
                />
              </FieldGroup>
              <FieldGroup label="WhatsApp Number">
                <PhoneInput
                  code={whatsappCode}
                  local={whatsappLocal}
                  onCodeChange={c => setWhatsapp(c, whatsappLocal)}
                  onLocalChange={n => setWhatsapp(whatsappCode, n)}
                  error={phoneErrors.whatsapp}
                />
              </FieldGroup>
              <div className="sm:col-span-2">
                <FieldGroup label="Address">
                  <TextInput value={form.address} onChange={v => set('address', v)} placeholder="-" />
                </FieldGroup>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              My Images <Lock className="w-4 h-4 text-gray-400" />
            </h2>
            <PrivacyBanner text="Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view." />
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >×</button>
                </div>
              ))}
              {form.images.length < 6 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-brand transition-colors">
                  {uploadingIdx !== null ? (
                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-2xl text-gray-300">+</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingIdx !== null} />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button onClick={() => setStep(2)} className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 sm:mr-auto">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => {
              if (!validatePhones()) return
              setError('')
              setStep('preview')
            }} className="px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Skip
            </button>
            <button onClick={() => {
              if (!validatePhones()) return
              setError('')
              setStep('preview')
            }} className="flex-1 py-2.5 rounded-full bg-brand text-on-brand font-semibold text-sm hover:opacity-90 transition-opacity">
              Save &amp; Review →
            </button>
          </div>
        </div>
    </div>
  )

  // Preview step
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        {header}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Review &amp; Confirm Your Profile</h2>

        <SectionCard title="Contact Details" icon={<Lock className="w-4 h-4 text-gray-400" />} onEdit={() => setStep(3)}>
          <PrivacyBanner text="Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view." />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PreviewField label="Mobile Number" value={form.mobileNumber} />
            <PreviewField label="WhatsApp Number" value={form.whatsappNumber} />
            <PreviewField label="Address" value={form.address} />
          </div>
        </SectionCard>

        <SectionCard title="My Images" icon={<Lock className="w-4 h-4 text-gray-400" />} onEdit={() => setStep(3)}>
          <PrivacyBanner text="Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view." />
          <div className="flex flex-wrap gap-2">
            {form.images.map((url, i) => (
              <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            ))}
            {form.images.length === 0 && <p className="text-xs text-gray-400">No images added</p>}
          </div>
        </SectionCard>

        <SectionCard title="Personal Info" onEdit={() => setStep(1)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <PreviewField label="First Name" value={form.firstName} />
            <PreviewField label="Last Name" value={form.lastName} />
            <PreviewField label="Date of Birth" value={form.dateOfBirth} />
            <PreviewField label="Nationality" value={form.nationality} />
            <PreviewField label="Gender" value={form.gender} />
            <PreviewField label="Ethnicity" value={form.ethnicity} />
            <PreviewField label="Caste" value={form.caste} />
            <PreviewField label="Civil Status" value={form.civilStatus} />
            <PreviewField label="Religion" value={form.religion} />
             <PreviewField label="Height" value={form.height} />
          </div>
        </SectionCard>

        <SectionCard title="Residency" onEdit={() => setStep(1)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <PreviewField label="Country" value={form.country} />
            <PreviewField label="City" value={form.city} />
            <PreviewField label="State / District" value={form.stateDistrict} />
          </div>
        </SectionCard>

        <SectionCard title="Education & Profession" onEdit={() => setStep(1)}>
          <div className="grid grid-cols-2 gap-3">
            <PreviewField label="Education" value={form.educationLevel} />
            <PreviewField label="Profession" value={form.profession} />
          </div>
        </SectionCard>

        <SectionCard title="Habits" onEdit={() => setStep(1)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PreviewField label="Drinking" value={form.drinking} />
            <PreviewField label="Smoking" value={form.smoking} />
            <PreviewField label="Food Preference" value={form.foodPreference} />
          </div>
        </SectionCard>

        <SectionCard title="Horoscope Info" icon={<Lock className="w-4 h-4 text-gray-400" />} onEdit={() => setStep(2)}>
          <PrivacyBanner text="Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view." />
          <div className="grid grid-cols-2 gap-3">
            <PreviewField label="Kuja Number" value={form.kujaNumber} />
            <PreviewField label="Birth Day" value={form.birthDay} />
          </div>
        </SectionCard>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2 mb-8">
          <button onClick={() => setStep(3)} className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 sm:mr-auto">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-full bg-brand text-on-brand font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Creating Account…' : 'Confirm & Create Account'}
          </button>
        </div>
    </div>
  )
}
