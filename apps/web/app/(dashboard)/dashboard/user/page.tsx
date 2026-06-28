'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, MessageCircle, Phone, ChevronLeft, User, Lock, Bell } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Relationship {
  isMutual: boolean
  myInterestStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null
  myInterestId: string | null
  theirInterestStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null
  theirInterestId: string | null
  myContactRequestStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null
  theirContactRequestStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | null
}

interface OtherProfile {
  id: string
  firstName: string
  lastName: string
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
  createdAt: string
  _relationship: Relationship
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

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4">
      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-4">{icon}{title}</h3>
      {children}
    </div>
  )
}

function OtherProfileInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const router = useRouter()
  const [profile, setProfile] = useState<OtherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [interestSent, setInterestSent] = useState(false)
  const [sendingInterest, setSendingInterest] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    if (!id) { router.replace('/dashboard/home'); return }
    apiFetch<OtherProfile>(`/users/${id}`)
      .then(setProfile)
      .catch(() => router.replace('/dashboard/home'))
      .finally(() => setLoading(false))
  }, [id, router])

  async function sendInterest() {
    setSendingInterest(true)
    try {
      await apiFetch('/matches/interests', {
        method: 'POST',
        body: JSON.stringify({ receiverId: id }),
      })
      const updated = await apiFetch<OtherProfile>(`/users/${id}`)
      setProfile(updated)
      setInterestSent(true)
    } catch {
      // noop
    } finally {
      setSendingInterest(false)
    }
  }

  async function removeInterest() {
    setSendingInterest(true)
    try {
      await apiFetch(`/matches/interests/${id}`, { method: 'DELETE' })
      const updated = await apiFetch<OtherProfile>(`/users/${id}`)
      setProfile(updated)
      setInterestSent(false)
    } catch {
      // noop
    } finally {
      setSendingInterest(false)
    }
  }

  async function respondInterest(action: 'ACCEPT' | 'DECLINE') {
    if (!profile?._relationship.theirInterestId) return
    try {
      await apiFetch(`/matches/interests/${profile._relationship.theirInterestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }),
      })
      const updated = await apiFetch<OtherProfile>(`/users/${id}`)
      setProfile(updated)
    } catch {
      // noop
    }
  }

  async function requestContact() {
    if (!profile) return
    setContactLoading(true)
    try {
      await apiFetch(`/matches/contact-request/${id}`, { method: 'POST' })
      setProfile(p => p ? { ...p, _relationship: { ...p._relationship, myContactRequestStatus: 'PENDING' } } : p)
    } catch {
      // noop
    } finally {
      setContactLoading(false)
    }
  }

  async function respondContact(action: 'ACCEPT' | 'DECLINE') {
    if (!profile) return
    setContactLoading(true)
    try {
      await apiFetch(`/matches/contact-request/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      setProfile(p => {
        if (!p) return p
        const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'
        return { ...p, _relationship: { ...p._relationship, theirContactRequestStatus: newStatus as 'ACCEPTED' | 'DECLINED' } }
      })
      if (action === 'ACCEPT') {
        // Reload to get contact info
        const updated = await apiFetch<OtherProfile>(`/users/${id}`)
        setProfile(updated)
      }
    } catch {
      // noop
    } finally {
      setContactLoading(false)
    }
  }

  async function openChat() {
    try {
      const conv = await apiFetch<{ id: string }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetId: id }),
      })
      router.push(`/dashboard/chat?c=${conv.id}`)
    } catch {
      router.push('/dashboard/chat')
    }
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  const rel = profile._relationship
  const cityCountry = [profile.city, profile.country].filter(Boolean).join(', ')

  const contactVisible =
    rel.myContactRequestStatus === 'ACCEPTED' &&
    rel.theirContactRequestStatus === 'ACCEPTED'

  const canChat = rel.isMutual || rel.myInterestStatus === 'ACCEPTED' || rel.theirInterestStatus === 'ACCEPTED'

  const heartIsPending = interestSent || rel.myInterestStatus === 'PENDING'
  const heartInterested = heartIsPending || rel.isMutual
  const heartCanSend = !heartInterested && !rel.theirInterestStatus
  const heartCanRemove = heartIsPending && !rel.isMutual
  const heartCls = heartInterested
    ? 'p-2 rounded-full border transition-colors border-brand bg-brand/5 text-brand hover:border-red-300 hover:text-red-400'
    : 'p-2 rounded-full border transition-colors border-gray-200 text-gray-400 hover:border-brand hover:text-brand'
  const heartIconCls = heartInterested ? 'w-4 h-4 fill-brand' : 'w-4 h-4'
  const heartTitle = rel.isMutual ? 'Mutual interest' : heartIsPending ? 'Remove interest' : 'Send interest'

  const incomingRequest = rel.theirContactRequestStatus === 'PENDING'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-gray-300" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-lg text-gray-900">{profile.firstName} {profile.lastName}</span>
                {profile.kujaNumber && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Kuja {profile.kujaNumber}
                  </span>
                )}
                {rel.isMutual && (
                  <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    ❤ Mutual
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Age {age(profile.dateOfBirth)} · Live: {cityCountry || 'Not set'}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 justify-center sm:justify-start">
                {profile.profession && <span>💼 {profile.profession}</span>}
                {profile.ethnicity && <span>👤 {profile.ethnicity}</span>}
                {profile.religion && <span>🕌 {profile.religion}</span>}
                {profile.height && <span>📏 {profile.height}</span>}
              </div>
            </div>

            {/* Actions: top right */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Open Chat: any accepted interest means a conversation exists */}
              {canChat && (
                <button
                  onClick={openChat}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  Open Chat
                </button>
              )}

              {/* They sent us an interest — Accept / Decline */}
              {!rel.isMutual && rel.theirInterestStatus === 'PENDING' && (
                <>
                  <button
                    onClick={() => respondInterest('ACCEPT')}
                    className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    ✓ Accept Interest
                  </button>
                  <button
                    onClick={() => respondInterest('DECLINE')}
                    className="px-4 py-2 rounded-full border border-gray-200 text-gray-500 text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}

              {/* We sent interest, waiting for their response */}
              {!rel.isMutual && rel.myInterestStatus === 'PENDING' && rel.theirInterestStatus !== 'PENDING' && (
                <span className="px-4 py-2 rounded-full border border-brand/30 bg-brand/5 text-brand text-sm font-medium">
                  ✓ Interest Sent
                </span>
              )}

              {/* No interest from either side yet — Show Interest button */}
              {!rel.isMutual && !rel.myInterestStatus && !rel.theirInterestStatus && (
                <button
                  onClick={sendInterest}
                  disabled={sendingInterest || interestSent}
                  className="px-4 py-2 rounded-full border border-brand text-brand text-sm font-medium hover:bg-brand hover:text-white transition-colors disabled:opacity-50"
                >
                  {interestSent ? '✓ Interest Sent' : sendingInterest ? 'Sending…' : 'Show Interest'}
                </button>
              )}

              {/* Heart button: toggle interest */}
              <button
                onClick={heartCanSend ? sendInterest : heartCanRemove ? removeInterest : undefined}
                disabled={sendingInterest}
                title={heartTitle}
                className={heartCls}
              >
                <Heart className={heartIconCls} />
              </button>
            </div>
          </div>
        </div>

        {/* Contact Details section — only for mutual matches */}
        {rel.isMutual && (
          <Section title="Contact Details">
            {/* State: incoming contact request */}
            {incomingRequest && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <Bell className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">&ldquo;{profile.firstName} {profile.lastName}&rdquo;</span> has requested to view your contact details.
                    <p className="text-xs text-gray-500 mt-1">If you share your details, both of you will be able to see each other&apos;s contact information.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => respondContact('ACCEPT')}
                    disabled={contactLoading}
                    className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Accept &amp; Share
                  </button>
                  <button
                    onClick={() => respondContact('DECLINE')}
                    disabled={contactLoading}
                    className="px-4 py-2 rounded-full border border-gray-200 text-gray-500 text-sm font-medium hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    Decline Request
                  </button>
                  <button onClick={openChat} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20">
                    <MessageCircle className="w-4 h-4" /> Open Chat
                  </button>
                </div>
              </div>
            )}

            {/* State: contact visible */}
            {contactVisible && !incomingRequest && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Phone className="w-4 h-4 text-brand shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">Mobile</p>
                    <p className="text-sm font-medium text-gray-800">{profile.mobileNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <Phone className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">WhatsApp</p>
                    <p className="text-sm font-medium text-gray-800">{profile.whatsappNumber || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* State: can request / pending */}
            {!contactVisible && !incomingRequest && (
              <div className="flex flex-wrap items-center gap-3">
                {rel.myContactRequestStatus === 'PENDING' ? (
                  <p className="text-sm text-gray-500 italic">Contact request sent. Waiting for response.</p>
                ) : rel.myContactRequestStatus === 'DECLINED' ? (
                  <p className="text-sm text-gray-400 italic">Your contact request was declined.</p>
                ) : (
                  <button
                    onClick={requestContact}
                    disabled={contactLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {contactLoading ? 'Requesting…' : 'Request Contact Details'}
                  </button>
                )}
                <button onClick={openChat} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20">
                  <MessageCircle className="w-4 h-4" /> Open Chat
                </button>
              </div>
            )}
          </Section>
        )}

        {/* My Images */}
        {profile.images?.length > 0 && (
          <Section title="Photos">
            <div className="flex flex-wrap gap-2">
              {profile.images.map((url, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Personal Info */}
        <Section title="Personal Info">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="First Name" value={profile.firstName} />
            <Field label="Last Name" value={profile.lastName} />
            <Field label="Age" value={String(age(profile.dateOfBirth))} />
            <Field label="Gender" value={profile.gender} />
            <Field label="Height" value={profile.height} />
            <Field label="Nationality" value={profile.nationality} />
            <Field label="Ethnicity" value={profile.ethnicity} />
            <Field label="Caste" value={profile.caste} />
            <Field label="Civil Status" value={profile.civilStatus} />
            <Field label="Religion" value={profile.religion} />
          </div>
        </Section>

        <Section title="Residency">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Country" value={profile.country} />
            <Field label="City" value={profile.city} />
            <Field label="State / District" value={profile.stateDistrict} />
          </div>
        </Section>

        <Section title="Education & Profession">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Education" value={profile.educationLevel} />
            <Field label="Profession" value={profile.profession} />
          </div>
        </Section>

        <Section title="Habits">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Drinking" value={profile.drinking} />
            <Field label="Smoking" value={profile.smoking} />
            <Field label="Food Preference" value={profile.foodPreference} />
          </div>
        </Section>

        <Section title="Horoscope Info" icon={<Lock className="w-4 h-4 text-gray-400" />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kuja Number" value={profile.kujaNumber} />
            <Field label="Birth Day" value={profile.birthDay} />
          </div>
        </Section>
      </div>
    </div>
  )
}

export default function OtherProfilePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OtherProfileInner />
    </Suspense>
  )
}
