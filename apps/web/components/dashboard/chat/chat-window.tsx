'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ArrowLeft, Info, Smile, Send, Loader2 } from 'lucide-react'
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

interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
  sender: ChatUser
}

interface MessagesResponse {
  messages: ChatMessage[]
  hasMore: boolean
}

interface Props {
  conversationId: string | null
  other: ChatUser | null
  currentUserId: string
  onBack: () => void
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const AVATAR_COLORS = [
  'bg-rose-200', 'bg-sky-200', 'bg-violet-200',
  'bg-amber-200', 'bg-emerald-200', 'bg-pink-200',
]
function avatarColor(id: string) {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export default function ChatWindow({ conversationId, other, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const convIdRef = useRef<string | null>(null)

  // Connect socket once
  useEffect(() => {
    let mounted = true
    getSocket()
      .then((socket) => {
        if (!mounted) return
        socketRef.current = socket

        socket.on('new_message', (msg: ChatMessage) => {
          if (msg.conversationId !== convIdRef.current) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        })
      })
      .catch(console.error)

    return () => {
      mounted = false
      socketRef.current?.off('new_message')
    }
  }, [])

  // Fetch messages when conversation changes
  const fetchMessages = useCallback(async (id: string) => {
    setLoading(true)
    setMessages([])
    try {
      const data = await apiFetch<MessagesResponse>(`/chat/conversations/${id}/messages`)
      setMessages(data.messages)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    convIdRef.current = conversationId

    if (!conversationId) {
      setMessages([])
      setHasMore(false)
      return
    }

    fetchMessages(conversationId)

    // Mark read
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_read', { conversationId })
    }
  }, [conversationId, fetchMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  async function loadMore() {
    if (!conversationId || !hasMore || messages.length === 0) return
    const cursor = messages[0].id
    try {
      const data = await apiFetch<MessagesResponse>(
        `/chat/conversations/${conversationId}/messages?cursor=${cursor}`
      )
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Failed to load more', err)
    }
  }

  function send() {
    if (!input.trim() || !conversationId || !socketRef.current?.connected) return
    setSending(true)
    setSendError('')
    const content = input.trim()
    setInput('')

    // The ack callback may never fire if the socket disconnects mid-send.
    const timeout = setTimeout(() => {
      setSending(false)
      setSendError('Message not delivered. Check your connection.')
    }, 10_000)

    socketRef.current.emit('send_message', { conversationId, content }, () => {
      clearTimeout(timeout)
      setSending(false)
    })
  }

  if (!conversationId || !other) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Send className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400">Select a conversation or start a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-900 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden text-gray-400 hover:text-white transition-colors mr-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {other.avatarUrl ? (
            <Image
              src={other.avatarUrl}
              alt=""
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600',
                avatarColor(other.id)
              )}
            >
              {other.firstName[0]}{other.lastName[0]}
            </div>
          )}
          <span className="text-white font-semibold">
            {other.firstName} {other.lastName}
          </span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={loadMore}
              className="text-xs text-brand hover:underline"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">
            No messages yet. Say hello!
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-xs px-4 py-2.5 rounded-2xl text-sm',
                      isMe
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-rose-50 text-gray-800 rounded-bl-sm'
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={cn(
                        'text-[10px] mt-1',
                        isMe ? 'text-white/60 text-right' : 'text-gray-400'
                      )}
                    >
                      {timeLabel(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {sendError && (
        <p className="text-xs text-red-500 text-center px-4 py-1 bg-white border-t border-gray-100">
          {sendError}
        </p>
      )}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <Smile className="w-5 h-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Write a message"
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-300"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  )
}
