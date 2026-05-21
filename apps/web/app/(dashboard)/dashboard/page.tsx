'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedOther, setSelectedOther] = useState<ChatUser | null>(null)

  useEffect(() => {
    apiFetch<Profile>('/auth/me')
      .then(setCurrentUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          router.replace('/onboarding')
        } else if (err instanceof ApiError && err.status === 401) {
          router.replace('/login')
        } else {
          console.error(err)
        }
      })
  }, [router])

  function handleSelect(id: string, other: ChatUser) {
    setSelectedId(id)
    setSelectedOther(other)
  }

  function handleBack() {
    setSelectedId(null)
    setSelectedOther(null)
  }

  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <ConversationList
        selectedId={selectedId}
        onSelect={handleSelect}
        currentUserId={currentUser.id}
      />
      <ChatWindow
        conversationId={selectedId}
        other={selectedOther}
        currentUserId={currentUser.id}
        onBack={handleBack}
      />
    </div>
  )
}
