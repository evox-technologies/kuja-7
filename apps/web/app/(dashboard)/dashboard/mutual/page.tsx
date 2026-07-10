'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import ProfileCard, { ProfileCardData } from '@/components/dashboard/profile-card'

interface MutualRecord {
  id: string
  updatedAt: string
  sender: ProfileCardData
}

export default function MutualPage() {
  const router = useRouter()
  const [mutuals, setMutuals] = useState<MutualRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<MutualRecord[]>('/matches/mutual')
      .then(setMutuals)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function openChat(profileId: string) {
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
    <div className="h-full overflow-y-auto min-w-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-4">
          <h2 className="font-bold text-gray-800">Mutual Interests</h2>
          <p className="text-xs text-gray-400 mt-0.5">Profiles where both of you have shown interest.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mutuals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No mutual interests yet</p>
            <p className="text-xs mt-1">When someone accepts your interest and you accept theirs, they appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mutuals.map(m => (
              <ProfileCard
                key={m.id}
                profile={{ ...m.sender, createdAt: m.updatedAt, myInterestStatus: 'ACCEPTED' }}
                badge={
                  <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>❤</span> Mutual
                  </span>
                }
                actions={
                  <button
                    onClick={() => openChat(m.sender.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-medium hover:bg-brand/20 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Open Chat
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
