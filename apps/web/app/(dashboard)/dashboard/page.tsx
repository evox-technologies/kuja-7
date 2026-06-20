'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ConversationList from '@/components/dashboard/chat/conversation-list'
import ChatWindow from '@/components/dashboard/chat/chat-window'
import RegisterUserGuard from '@/components/dashboard/register-user-guard'
import { apiFetch, ApiError } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n/use-i18n'

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
  return (
    <RegisterUserGuard>
      <ChatPageContent />
    </RegisterUserGuard>
  )
}

function ChatPageContent() {
  const router = useRouter()
  const { t } = useI18n()
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedOther, setSelectedOther] = useState<ChatUser | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  useEffect(() => {
    apiFetch<Profile>('/auth/me')
      .then(setCurrentUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login')
        } else {
          console.error(err)
        }
      })
  }, [router])

  function handleSelect(id: string, other: ChatUser) {
    setSelectedId(id)
    setSelectedOther(other)
    setMobileShowChat(true)
  }

  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div data-scale-component="chat" className="h-full flex relative">
      <div
        className={`${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        } shrink-0 w-full md:w-72 h-full`}
      >
        <ConversationList
          selectedId={selectedId}
          onSelect={handleSelect}
          currentUserId={currentUser.id}
        />
      </div>

      <div
        className={`${
          mobileShowChat ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full`}
      >
        {mobileShowChat && (
          <button
            type="button"
            onClick={() => setMobileShowChat(false)}
            className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border-b border-gray-100 bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        )}
        <ChatWindow
          conversationId={selectedId}
          other={selectedOther}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  )
}
