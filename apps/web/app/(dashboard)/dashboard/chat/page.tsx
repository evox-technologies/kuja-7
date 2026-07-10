'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ConversationList from '@/components/dashboard/chat/conversation-list'
import ChatWindow from '@/components/dashboard/chat/chat-window'
import { apiFetch, ApiError } from '@/lib/api'

interface Profile {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

interface ChatUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

function ChatPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoSelectId = searchParams.get('c') ?? undefined
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedOther, setSelectedOther] = useState<ChatUser | null>(null)
  const [showList, setShowList] = useState(true)

  useEffect(() => {
    apiFetch<Profile>('/auth/me')
      .then(setCurrentUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) router.replace('/onboarding')
        else if (err instanceof ApiError && err.status === 401) router.replace('/login')
        else console.error(err)
      })
  }, [router])

  function handleSelect(id: string, other: ChatUser) {
    setSelectedId(id)
    setSelectedOther(other)
    setShowList(false)
  }

  if (!currentUser) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div data-scale-component="chat" className="h-full flex overflow-hidden">
      <div className={`${showList ? 'flex' : 'hidden'} lg:flex shrink-0`}>
        <ConversationList
          selectedId={selectedId}
          onSelect={handleSelect}
          currentUserId={currentUser.id}
          autoSelectId={autoSelectId}
        />
      </div>

      <div className={`${!showList ? 'flex' : 'hidden'} lg:flex flex-1`}>
        <ChatWindow
          conversationId={selectedId}
          other={selectedOther}
          currentUserId={currentUser.id}
          onBack={() => setShowList(true)}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  )
}
