'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Lock, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { Panel } from '@/components/admin/page-header'
import {
  FieldGrid,
  FormDate,
  FormField,
  FormSelect,
  FormTextarea,
  HeightField,
  RequiredStar,
} from '@/components/admin/form-fields'
import { adminApi } from '@/lib/admin/api'
import { apiFetch, errorMessage } from '@/lib/api'
import {
  CIVIL_STATUSES,
  COUNTRIES,
  DRINKING_OPTS,
  EDUCATION_LEVELS,
  ETHNICITIES,
  FOOD_PREFS,
  KUJA_NUMBERS,
  MIN_AGE,
  NATIONALITIES,
  PROFESSIONS,
  RELIGIONS,
  SMOKING_OPTS,
  citiesForCountry,
  districtsForCountry,
} from '@/lib/options'
import type { AdminUserDetail } from '@/lib/admin/types'

/**
 * One form for both "Add user" and "Edit user".
 *
 * The mandatory set is the same one the API uses to decide profileCompleted
 * (apps/api/src/auth/auth.service.ts) — a profile saved here without them would
 * be unable to send interests, which is not obvious from the admin side.
 */
export interface UserDraft {
  firstName: string
  lastName: string
  email: string
  gender: string
  dateOfBirth: string
  nationality: string
  ethnicity: string
  caste: string
  civilStatus: string
  religion: string
  height: string
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
  bio: string
  images: string[]
  isDummy: boolean
}

const REQUIRED: (keyof UserDraft)[] = [
  'firstName',
  'lastName',
  'email',
  'gender',
  'dateOfBirth',
  'mobileNumber',
  'address',
  'height',
  'country',
  'city',
  'educationLevel',
  'profession',
  'kujaNumber',
  'birthDay',
]

const MAX_IMAGES = 6

export function emptyDraft(): UserDraft {
  return {
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    ethnicity: '',
    caste: '',
    civilStatus: '',
    religion: '',
    height: '',
    country: '',
    city: '',
    stateDistrict: '',
    educationLevel: '',
    profession: '',
    drinking: '',
    smoking: '',
    foodPreference: '',
    kujaNumber: '',
    birthDay: '',
    mobileNumber: '',
    whatsappNumber: '',
    address: '',
    bio: '',
    images: [],
    isDummy: false,
  }
}

export function draftFromProfile(profile: AdminUserDetail): UserDraft {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    gender: profile.gender ?? '',
    dateOfBirth: isoDate(profile.dateOfBirth),
    nationality: profile.nationality ?? '',
    ethnicity: profile.ethnicity ?? '',
    caste: profile.caste ?? '',
    civilStatus: profile.civilStatus ?? '',
    religion: profile.religion ?? '',
    height: profile.height ?? '',
    country: profile.country ?? '',
    city: profile.city ?? '',
    stateDistrict: profile.stateDistrict ?? '',
    educationLevel: profile.educationLevel ?? '',
    profession: profile.profession ?? '',
    drinking: profile.drinking ?? '',
    smoking: profile.smoking ?? '',
    foodPreference: profile.foodPreference ?? '',
    kujaNumber: profile.kujaNumber ?? '',
    birthDay: profile.birthDay ?? '',
    mobileNumber: profile.mobileNumber ?? '',
    whatsappNumber: profile.whatsappNumber ?? '',
    address: profile.address ?? '',
    bio: profile.bio ?? '',
    images: profile.images ?? [],
    isDummy: profile.isDummy ?? false,
  }
}

export function UserForm({
  mode,
  initial,
  userId,
}: {
  mode: 'create' | 'edit'
  initial: UserDraft
  userId?: string
}) {
  const router = useRouter()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<UserDraft>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof UserDraft, true>>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')

  const cities = useMemo(() => citiesForCountry(draft.country), [draft.country])
  const districts = useMemo(() => districtsForCountry(draft.country), [draft.country])

  function set<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
  }

  function setCountry(country: string) {
    // City and district lists are derived from the country, so a stale city
    // from the previous country would silently save as nonsense.
    setDraft((d) => ({ ...d, country, city: '', stateDistrict: '' }))
  }

  async function uploadImage(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (file.type && !allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG and WebP images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Images must be under 5 MB.')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { url } = await apiFetch<{ url: string }>('/upload/image', { method: 'POST', body })
      setDraft((d) => ({ ...d, images: [...d.images, url].slice(0, MAX_IMAGES) }))
    } catch (err) {
      toast.error(errorMessage(err, 'Image upload failed'))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    const found: Partial<Record<keyof UserDraft, true>> = {}
    for (const field of REQUIRED) {
      const value = draft[field]
      if (typeof value === 'string' && !value.trim()) found[field] = true
    }

    if (Object.keys(found).length) {
      setErrors(found)
      setSaveError('Fill in every field marked with an asterisk.')
      return
    }

    setSaving(true)
    setSaveError('')

    // Empty optional strings are dropped rather than saved as '' — the API
    // treats absent and blank differently when computing profileCompleted.
    const payload: Record<string, unknown> = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      gender: draft.gender,
      dateOfBirth: toIso(draft.dateOfBirth),
      isDummy: draft.isDummy,
      images: draft.images,
      location: [draft.city, draft.stateDistrict, draft.country].filter(Boolean).join(', '),
    }
    const optional: (keyof UserDraft)[] = [
      'nationality', 'ethnicity', 'caste', 'civilStatus', 'religion', 'height',
      'country', 'city', 'stateDistrict', 'educationLevel', 'profession',
      'drinking', 'smoking', 'foodPreference', 'kujaNumber', 'birthDay',
      'mobileNumber', 'whatsappNumber', 'address', 'bio',
    ]
    for (const key of optional) {
      const value = draft[key]
      if (typeof value === 'string' && value.trim()) payload[key] = value.trim()
    }

    try {
      if (mode === 'create') {
        const created = await adminApi.createUser(payload)
        toast.success(`${created.firstName} ${created.lastName} added.`)
        router.push(`/admin/users/view?id=${created.id}`)
      } else if (userId) {
        await adminApi.updateUser(userId, payload)
        toast.success('Profile updated.')
        router.push(`/admin/users/view?id=${userId}`)
      }
    } catch (err) {
      setSaveError(errorMessage(err, 'Could not save this profile'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-24">
      <Panel title="Profile type" className="mb-4">
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={draft.isDummy}
            onCheckedChange={(checked) => set('isDummy', checked === true)}
            className="mt-0.5"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Sparkles className="h-3.5 w-3.5 text-brand-hover" />
              Sample profile
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
              For pre-launch seeding. A sample profile has no sign-in account, and the platform
              answers on its behalf: any member who sends it an interest is matched instantly,
              and any request for its contact details is approved on the spot. Members can open
              a chat with it, but nobody will reply.
            </span>
          </span>
        </label>
      </Panel>

      <Panel title="Basic details" className="mb-4">
        <FieldGrid>
          <FormField label="First name" value={draft.firstName} onChange={(v) => set('firstName', v)} required error={errors.firstName} />
          <FormField label="Last name" value={draft.lastName} onChange={(v) => set('lastName', v)} required error={errors.lastName} />
          <FormField label="Email" type="email" value={draft.email} onChange={(v) => set('email', v)} required error={errors.email} hint={mode === 'create' && draft.isDummy ? 'Sample profiles never receive email, but the address must still be unique.' : undefined} />
          <FormSelect label="Gender" value={draft.gender} onChange={(v) => set('gender', v)} options={['MALE', 'FEMALE']} required error={errors.gender} />
          <FormDate label="Date of birth" value={draft.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} required error={errors.dateOfBirth} max={maxAdultBirthDate()} hint={`Must be at least ${MIN_AGE}.`} />
          <FormSelect label="Nationality" value={draft.nationality} onChange={(v) => set('nationality', v)} options={NATIONALITIES} />
          <FormSelect label="Ethnicity" value={draft.ethnicity} onChange={(v) => set('ethnicity', v)} options={ETHNICITIES} />
          <FormField label="Caste" value={draft.caste} onChange={(v) => set('caste', v)} />
          <FormSelect label="Civil status" value={draft.civilStatus} onChange={(v) => set('civilStatus', v)} options={CIVIL_STATUSES} />
          <FormSelect label="Religion" value={draft.religion} onChange={(v) => set('religion', v)} options={RELIGIONS} />
          <HeightField value={draft.height} onChange={(v) => set('height', v)} required error={errors.height} />
        </FieldGrid>
      </Panel>

      <Panel title="Residency" className="mb-4">
        <FieldGrid>
          <FormSelect label="Country" value={draft.country} onChange={setCountry} options={COUNTRIES} required error={errors.country} />
          <FormSelect label="City" value={draft.city} onChange={(v) => set('city', v)} options={cities} required error={errors.city} />
          <FormSelect label="State / district" value={draft.stateDistrict} onChange={(v) => set('stateDistrict', v)} options={districts} />
        </FieldGrid>
      </Panel>

      <Panel title="Education, work and habits" className="mb-4">
        <FieldGrid>
          <FormSelect label="Education level" value={draft.educationLevel} onChange={(v) => set('educationLevel', v)} options={EDUCATION_LEVELS} required error={errors.educationLevel} />
          <FormSelect label="Profession" value={draft.profession} onChange={(v) => set('profession', v)} options={PROFESSIONS} required error={errors.profession} />
          <FormSelect label="Drinking" value={draft.drinking} onChange={(v) => set('drinking', v)} options={DRINKING_OPTS} />
          <FormSelect label="Smoking" value={draft.smoking} onChange={(v) => set('smoking', v)} options={SMOKING_OPTS} />
          <FormSelect label="Food preference" value={draft.foodPreference} onChange={(v) => set('foodPreference', v)} options={FOOD_PREFS} />
        </FieldGrid>
      </Panel>

      <Panel title="Horoscope" className="mb-4">
        <FieldGrid>
          <FormSelect label="Kuja number" value={draft.kujaNumber} onChange={(v) => set('kujaNumber', v)} options={KUJA_NUMBERS} required error={errors.kujaNumber} />
          <FormDate label="Birth day" value={draft.birthDay} onChange={(v) => set('birthDay', v)} required error={errors.birthDay} />
        </FieldGrid>
      </Panel>

      <Panel
        title="Contact details"
        description="Private. Only shown to a mutual match once both sides accept a contact request."
        className="mb-4"
      >
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-info-bg px-3 py-2 text-xs text-info">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>These fields are never returned by the public profile API until contact is agreed.</p>
        </div>
        <FieldGrid>
          <FormField label="Mobile number" value={draft.mobileNumber} onChange={(v) => set('mobileNumber', v)} required error={errors.mobileNumber} placeholder="+94 771234567" />
          <FormField label="WhatsApp number" value={draft.whatsappNumber} onChange={(v) => set('whatsappNumber', v)} placeholder="+94 771234567" />
        </FieldGrid>
        <div className="mt-3 sm:mt-4">
          <FormTextarea label="Address" value={draft.address} onChange={(v) => set('address', v)} required error={errors.address} rows={2} />
        </div>
        <div className="mt-3 sm:mt-4">
          <FormTextarea label="About" value={draft.bio} onChange={(v) => set('bio', v)} rows={3} placeholder="A short introduction shown on the profile." />
        </div>
      </Panel>

      <Panel
        title="Photos"
        description={`Up to ${MAX_IMAGES}. The first is used as the main picture.`}
        className="mb-4"
      >
        <div className="flex flex-wrap gap-3">
          {draft.images.map((url, i) => (
            <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => set('images', draft.images.filter((u) => u !== url))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-black/80"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[9px] font-semibold text-white">
                  Main
                </span>
              )}
            </div>
          ))}

          {draft.images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-brand-border hover:text-brand-hover disabled:opacity-50"
            >
              {uploading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            // Reset so re-picking the same file fires change again.
            e.target.value = ''
            if (file) void uploadImage(file)
          }}
        />
      </Panel>

      {/* Sticky action bar, same pattern as the member profile editor. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur lg:left-60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          {saveError ? (
            <p className="min-w-0 flex-1 text-xs text-danger">{saveError}</p>
          ) : (
            <p className="hidden flex-1 text-xs text-gray-400 sm:block">
              Fields marked <RequiredStar /> are required before this profile can send or receive
              interests.
            </p>
          )}
          <Button variant="ghost" className="rounded-xl" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button className="rounded-xl" loading={saving} onClick={() => void save()}>
            {mode === 'create' ? 'Create profile' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function isoDate(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

function toIso(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return `${dateStr}T00:00:00.000Z`
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toISOString()
}

function maxAdultBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().slice(0, 10)
}
