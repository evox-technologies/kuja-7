'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Heart, User } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { timeAgo } from '@/lib/utils'
import { defaultAvatarSrc } from '@/lib/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

interface Actor {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  gender?: string | null
}

interface AppNotification {
  id: string
  type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED'
  read: boolean
  createdAt: string
  actor: Actor
}

function messageFor(n: AppNotification) {
  const name = `${n.actor.firstName} ${n.actor.lastName}`
  return n.type === 'INTEREST_ACCEPTED'
    ? `${name} accepted your interest`
    : `${name} sent you an interest`
}

export default function NotificationInterests() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(() => {
    apiFetch<{ items: AppNotification[]; unreadCount: number }>('/notifications')
      .then(r => {
        setItems(r.items)
        setUnreadCount(r.unreadCount)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()

    let mounted = true
    getSocket()
      .then(socket => {
        if (!mounted) return
        socket.on('notification', (n: AppNotification) => {
          setItems(prev => [n, ...prev])
          setUnreadCount(prev => prev + 1)
        })
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [refresh])

  function handleOpenChange(open: boolean) {
    if (open && unreadCount > 0) {
      apiFetch('/notifications/mark-read', { method: 'POST' }).catch(() => {})
      setUnreadCount(0)
      setItems(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors hidden sm:block">
          <Users className="w-5 h-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 bg-brand rounded-full text-[9px] font-semibold flex items-center justify-center text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No notifications yet</p>
          ) : (
            items.map(n => {
              const src = n.actor.avatarUrl ?? defaultAvatarSrc(n.actor.gender)
              return (
                <Link
                  key={n.id}
                  href={`/dashboard/user?id=${n.actor.id}`}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    n.read ? '' : 'bg-brand/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 flex items-start gap-1">
                      {n.type === 'INTEREST_ACCEPTED' ? (
                        <Heart className="w-3 h-3 fill-brand text-brand shrink-0 mt-0.5" />
                      ) : (
                        <Heart className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span>{messageFor(n)}</span>
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(n.createdAt)}</p>
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
