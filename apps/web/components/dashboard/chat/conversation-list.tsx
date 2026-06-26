'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, PenSquare, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

interface ChatUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

interface ConversationItem {
  id: string
  other: ChatUser
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
  } | null
}

interface NewMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

interface Props {
  selectedId: string | null
  onSelect: (id: string, other: ChatUser) => void
  currentUserId: string
  autoSelectId?: string
}

function initials(user: ChatUser) {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-rose-200',
  'bg-sky-200',
  'bg-violet-200',
  'bg-amber-200',
  'bg-emerald-200',
  'bg-pink-200',
]

function avatarColor(id: string) {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function ConversationList({ selectedId, onSelect, currentUserId, autoSelectId }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newChatMode, setNewChatMode] = useState(false)
  const [query, setQuery] = useState('')
  const [userResults, setUserResults] = useState<ChatUser[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch conversations on mount
  useEffect(() => {
    apiFetch<ConversationItem[]>('/chat/conversations')
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Auto-select a specific conversation when navigated via ?c= param
  useEffect(() => {
    if (!autoSelectId || loading) return
    const conv = conversations.find(c => c.id === autoSelectId)
    if (conv) onSelect(conv.id, conv.other)
  }, [autoSelectId, conversations, loading, onSelect])

  // Socket: update last message preview on new_message
  useEffect(() => {
    let mounted = true
    getSocket()
      .then((socket) => {
        if (!mounted) return
        socketRef.current = socket
        socket.on('new_message', (msg: NewMessage) => {
          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === msg.conversationId
                  ? { ...c, lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId } }
                  : c
              )
              .sort((a, b) => {
                const ta = a.lastMessage?.createdAt ?? a.id
                const tb = b.lastMessage?.createdAt ?? b.id
                return tb > ta ? 1 : -1
              })
          )
        })
      })
      .catch(console.error)

    return () => {
      mounted = false
    }
  }, [])

  // Debounced user search
  const searchUsers = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setUserResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await apiFetch<ChatUser[]>(`/users/chat-search?q=${encodeURIComponent(q)}`)
        setUserResults(results)
      } catch {
        setUserResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (newChatMode) searchUsers(q)
  }

  async function startChat(user: ChatUser) {
    setCreating(true)
    try {
      const conv = await apiFetch<{ id: string; other: ChatUser }>('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ targetId: user.id }),
      })

      // Ensure socket joins the new room
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_conversation', { conversationId: conv.id })
      }

      // Add to list if not already there
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id)
        if (exists) return prev
        return [{ id: conv.id, other: conv.other, lastMessage: null }, ...prev]
      })

      onSelect(conv.id, conv.other)
      setNewChatMode(false)
      setQuery('')
      setUserResults([])
    } catch (err) {
      console.error('Failed to start chat', err)
    } finally {
      setCreating(false)
    }
  }

  const filteredConversations = newChatMode
    ? conversations
    : conversations.filter((c) =>
        `${c.other.firstName} ${c.other.lastName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )

  return (
    <div className="shrink-0 bg-white border-r border-gray-100 flex flex-col w-full md:w-72 h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => {
              setNewChatMode((v) => !v)
              setQuery('')
              setUserResults([])
            }}
            className="text-gray-400 hover:text-brand transition-colors"
            title={newChatMode ? 'Cancel' : 'New chat'}
          >
            {newChatMode ? <X className="w-5 h-5" /> : <PenSquare className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder={newChatMode ? 'Search people…' : 'Search'}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand/20"
            autoFocus={newChatMode}
          />
        </div>

        {newChatMode && (
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Type a name to start a new conversation
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New Chat: user search results */}
        {newChatMode ? (
          <>
            {searching || creating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : userResults.length > 0 ? (
              userResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startChat(user)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold text-gray-600',
                        avatarColor(user.id)
                      )}
                    >
                      {initials(user)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </span>
                </button>
              ))
            ) : query.trim() ? (
              <p className="text-xs text-gray-400 text-center py-8">No users found</p>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">
                Start typing to search
              </p>
            )}
          </>
        ) : (
          /* Conversations list */
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                {query ? 'No conversations match' : 'No conversations yet'}
              </p>
            ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id, c.other)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                    selectedId === c.id ? 'bg-brand/5' : 'hover:bg-gray-50'
                  )}
                >
                  {c.other.avatarUrl ? (
                    <Image
                      src={c.other.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold text-gray-600',
                        avatarColor(c.other.id)
                      )}
                    >
                      {initials(c.other)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {c.other.firstName} {c.other.lastName}
                      </span>
                      {c.lastMessage && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {timeLabel(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 truncate block">
                      {c.lastMessage
                        ? c.lastMessage.senderId === currentUserId
                          ? `You: ${c.lastMessage.content}`
                          : c.lastMessage.content
                        : 'Start the conversation'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
