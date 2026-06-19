'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Pencil, User, Check, X } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api'

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

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm bg-gray-50 rounded-xl px-3 py-2 text-gray-700 min-h-[36px]">{value || '-'}</p>
    </div>
  )
}

function EditableField({ label, value, onSave }: {
  label: string; value: string; onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try { await onSave(val); setEditing(false) }
    finally { setSaving(false) }
  }

  if (!editing) return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 text-gray-700 min-h-[36px]">{val || '-'}</p>
        <button onClick={() => setEditing(true)} className="p-1.5 text-gray-300 hover:text-brand transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )

  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          className="flex-1 text-sm bg-white border border-brand rounded-xl px-3 py-2 focus:outline-none"
          autoFocus
        />
        <button onClick={save} disabled={saving} className="p-1.5 text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></button>
        <button onClick={() => { setVal(value); setEditing(false) }} className="p-1.5 text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4">
      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-4">
        {icon}{title}
      </h3>
      {children}
    </div>
  )
}

export default function OwnProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  useEffect(() => {
    apiFetch<Profile>('/auth/me')
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace('/login')
        else if (err instanceof ApiError && err.status === 404) router.replace('/onboarding')
      })
      .finally(() => setLoading(false))
  }, [router])

  async function patch(data: Record<string, unknown>) {
    const updated = await apiFetch<Profile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    setProfile(updated)
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
      await patch({ images: [...profile.images, res.url] })
    } catch {
      // noop
    } finally {
      setUploadingIdx(null)
    }
  }

  async function removeImage(url: string) {
    if (!profile) return
    await patch({ images: profile.images.filter(i => i !== url) })
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const cityCountry = [profile.city, profile.country].filter(Boolean).join(', ')

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">

        {/* Profile header */}
        <div className="bg-gray-900 text-white rounded-2xl p-5 mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-9 h-9 text-gray-500" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-lg">{profile.firstName} {profile.lastName}</span>
              {profile.kujaNumber && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kuja {profile.kujaNumber}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 mt-1">Age {age(profile.dateOfBirth)} · Live: {cityCountry || 'Not set'}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 justify-center sm:justify-start">
              {profile.profession && <span>💼 {profile.profession}</span>}
              {profile.ethnicity && <span>👤 {profile.ethnicity}</span>}
              {profile.religion && <span>🕌 {profile.religion}</span>}
              {profile.height && <span>📏 {profile.height}</span>}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <Section title="Contact Details" icon={<Lock className="w-4 h-4 text-gray-400" />}>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-4">
            Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField label="Mobile Number" value={profile.mobileNumber ?? ''} onSave={v => patch({ mobileNumber: v })} />
            <EditableField label="WhatsApp Number" value={profile.whatsappNumber ?? ''} onSave={v => patch({ whatsappNumber: v })} />
            <EditableField label="Address" value={profile.address ?? ''} onSave={v => patch({ address: v })} />
          </div>
        </Section>

        {/* My Images */}
        <Section title="My Images" icon={<Lock className="w-4 h-4 text-gray-400" />}>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-4">
            Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view.
          </p>
          <div className="flex flex-wrap gap-3">
            {profile.images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
            {profile.images.length < 6 && (
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
        </Section>

        {/* Personal Info */}
        <Section title="Personal Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField label="First Name" value={profile.firstName} onSave={v => patch({ firstName: v })} />
            <EditableField label="Last Name" value={profile.lastName} onSave={v => patch({ lastName: v })} />
            <Field label="Age" value={String(age(profile.dateOfBirth))} />
            <Field label="Birthday" value={profile.dateOfBirth} />
            <Field label="Gender" value={profile.gender} />
            <EditableField label="Height" value={profile.height ?? ''} onSave={v => patch({ height: v })} />
            <EditableField label="Nationality" value={profile.nationality ?? ''} onSave={v => patch({ nationality: v })} />
            <EditableField label="Ethnicity" value={profile.ethnicity ?? ''} onSave={v => patch({ ethnicity: v })} />
            <EditableField label="Caste" value={profile.caste ?? ''} onSave={v => patch({ caste: v })} />
            <EditableField label="Civil Status" value={profile.civilStatus ?? ''} onSave={v => patch({ civilStatus: v })} />
            <EditableField label="Religion" value={profile.religion ?? ''} onSave={v => patch({ religion: v })} />
          </div>
        </Section>

        {/* Residency */}
        <Section title="Residency">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <EditableField label="Country" value={profile.country ?? ''} onSave={v => patch({ country: v })} />
            <EditableField label="City" value={profile.city ?? ''} onSave={v => patch({ city: v })} />
            <EditableField label="State / District" value={profile.stateDistrict ?? ''} onSave={v => patch({ stateDistrict: v })} />
          </div>
        </Section>

        {/* Education & Profession */}
        <Section title="Education & Profession">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField label="Education" value={profile.educationLevel ?? ''} onSave={v => patch({ educationLevel: v })} />
            <EditableField label="Profession" value={profile.profession ?? ''} onSave={v => patch({ profession: v })} />
          </div>
        </Section>

        {/* Habits */}
        <Section title="Habits">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <EditableField label="Drinking" value={profile.drinking ?? ''} onSave={v => patch({ drinking: v })} />
            <EditableField label="Smoking" value={profile.smoking ?? ''} onSave={v => patch({ smoking: v })} />
            <EditableField label="Food Preference" value={profile.foodPreference ?? ''} onSave={v => patch({ foodPreference: v })} />
          </div>
        </Section>

        {/* Horoscope */}
        <Section title="Horoscope Info" icon={<Lock className="w-4 h-4 text-gray-400" />}>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2 mb-4">
            Your private details (photos, contact info, and horoscope) are only visible to profiles you grant permission to view.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EditableField label="Kuja Number" value={profile.kujaNumber ?? ''} onSave={v => patch({ kujaNumber: v })} />
            <EditableField label="Birth Day" value={profile.birthDay ?? ''} onSave={v => patch({ birthDay: v })} />
          </div>
        </Section>
      </div>
    </div>
  )
}
