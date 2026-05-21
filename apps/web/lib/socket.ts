import { io, Socket } from 'socket.io-client'
import { createClient } from './supabase/client'

let _socket: Socket | null = null

export async function getSocket(): Promise<Socket> {
  if (_socket?.connected) return _socket

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (_socket) {
    _socket.disconnect()
    _socket = null
  }

  return new Promise((resolve, reject) => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token: session?.access_token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    _socket = socket

    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', (err) => {
      _socket = null
      reject(err)
    })
  })
}

export function disconnectSocket() {
  _socket?.disconnect()
  _socket = null
}
