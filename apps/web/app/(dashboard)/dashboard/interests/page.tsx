'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import ProfileCard, { ProfileCardData } from '@/components/dashboard/profile-card'

interface InterestRecord {
  id: string
  status: string
  createdAt: string
  sender?: ProfileCardData
  receiver?: ProfileCardData
}

type Tab = 'received' | 'sent'

function RespondButtons({ interestId, profileId }: { interestId: string; profileId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'accepted' | 'declined'>('idle')

  async function respond(action: 'ACCEPTED' | 'REJECTED') {
    setState('loading')
    try {
      await apiFetch(`/matches/interests/${interestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action }),
      })
      setState(action === 'ACCEPTED' ? 'accepted' : 'declined')
    } catch {
      setState('idle')
    }
  }

  async function openChat() {
    try {
      const conv = await apiFetch<{ id: string }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetId: profileId }),
      })
      router.push(`/dashboard/chat?c=${conv.id}`)
    } catch {
      router.push('/dashboard/chat')
    }
  }

  if (state === 'accepted') {
    return (
      <button
        onClick={openChat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-on-brand text-xs font-medium hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Open Chat
      </button>
    )
  }

  if (state === 'declined') {
    return (
      <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-400">
        Declined
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => respond('ACCEPTED')}
        disabled={state === 'loading'}
        className="px-3 py-1.5 rounded-full bg-brand text-on-brand text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Accept
      </button>
      <button
        onClick={() => respond('REJECTED')}
        disabled={state === 'loading'}
        className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-medium hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  )
}

function OpenChatButton({ profileId }: { profileId: string }) {
  const router = useRouter()

  async function openChat() {
    try {
      const conv = await apiFetch<{ id: string }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetId: profileId }),
      })
      router.push(`/dashboard/chat?c=${conv.id}`)
    } catch {
      router.push('/dashboard/chat')
    }
  }

  return (
    <button
      onClick={openChat}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-on-brand text-xs font-medium hover:opacity-90 transition-opacity"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      Open Chat
    </button>
  )
}

export default function InterestsPage() {
  const [tab, setTab] = useState<Tab>('received')
  const [received, setReceived] = useState<InterestRecord[]>([])
  const [sent, setSent] = useState<InterestRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        apiFetch<InterestRecord[]>('/matches/interests/received'),
        apiFetch<InterestRecord[]>('/matches/interests/sent'),
      ])
      setReceived(r)
      setSent(s)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const items = tab === 'received' ? received : sent

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Sent / Received toggle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex bg-gray-100 rounded-full p-1">
            {(['sent', 'received'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No {tab} interests yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(item => {
              const profile = tab === 'received' ? item.sender : item.receiver
              if (!profile) return null
              const myInterestStatus = tab === 'sent' && (item.status === 'PENDING' || item.status === 'ACCEPTED')
                ? item.status as 'PENDING' | 'ACCEPTED'
                : undefined
              return (
                <ProfileCard
                  key={item.id}
                  profile={{ ...profile, createdAt: item.createdAt, myInterestStatus }}
                  note={tab === 'received' ? `${profile.firstName} has shown interest` : undefined}
                  actions={
                    tab === 'received' ? (
                      <RespondButtons interestId={item.id} profileId={profile.id} />
                    ) : item.status === 'ACCEPTED' ? (
                      <OpenChatButton profileId={profile.id} />
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                        item.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.status === 'REJECTED' ? 'Declined' : 'Pending'}
                      </span>
                    )
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
