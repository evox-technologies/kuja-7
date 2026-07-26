'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell, MessageCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { cn, timeAgo } from '@/lib/utils'
import { defaultAvatarSrc } from '@/lib/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

interface ChatUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  gender?: string | null
}

interface ConversationSummary {
  id: string
  other: ChatUser
  lastMessage: { id: string; content: string; createdAt: string; senderId: string } | null
  unreadCount: number
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loaded, setLoaded] = useState(false)

  const refreshCount = useCallback(() => {
    apiFetch<{ count: number }>('/chat/unread-count')
      .then(r => setCount(r.count))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshCount()

    let mounted = true
    getSocket()
      .then(socket => {
        if (!mounted) return
        socket.on('new_message', refreshCount)
        socket.on('messages_read', refreshCount)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [refreshCount])

  function handleOpenChange(open: boolean) {
    if (open && !loaded) {
      apiFetch<ConversationSummary[]>('/chat/conversations')
        .then(setConversations)
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }

  const unread = conversations.filter(c => c.unreadCount > 0)

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          {count > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-brand rounded-full text-[9px] font-semibold flex items-center justify-center text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Messages</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {unread.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No new messages</p>
          ) : (
            unread.map(c => {
              const src = c.other.avatarUrl ?? defaultAvatarSrc(c.other.gender)
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/chat?c=${c.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {c.other.firstName} {c.other.lastName}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-bold text-white rounded-full px-1.5 py-0.5 shrink-0',
                          'bg-brand'
                        )}
                      >
                        {c.unreadCount}
                      </span>
                    </div>
                    {c.lastMessage && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {c.lastMessage.content}
                      </p>
                    )}
                    {c.lastMessage && (
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {timeAgo(c.lastMessage.createdAt)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
