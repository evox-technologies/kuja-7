import { io, Socket } from 'socket.io-client'
import { createClient } from './supabase/client'

let _socket: Socket | null = null
let _pending: Promise<Socket> | null = null
let _authWatch = false

/**
 * Returns the shared socket, connecting it on first use.
 *
 * Concurrent callers share one in-flight connection. Without that, a second
 * caller arriving while the first was still connecting used to tear the
 * half-open socket down and start another — the earlier caller's promise then
 * never settled, so it never got to attach its listeners and silently received
 * no events for the rest of the session.
 */
export async function getSocket(): Promise<Socket> {
  if (_socket?.connected) return _socket
  if (_pending) return _pending

  // A socket that exists but is offline is mid-reconnect. Wait for it rather
  // than replacing it, which would drop every listener already attached to it.
  const promise = _socket ? waitForConnect(_socket) : connect()

  _pending = promise.finally(() => {
    _pending = null
  })

  return _pending
}

export function disconnectSocket() {
  _socket?.disconnect()
  _socket = null
  _pending = null
}

async function connect(): Promise<Socket> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
    auth: { token: session?.access_token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
  })

  _socket = socket

  // Supabase rotates the access token roughly hourly. socket.io replays the
  // original handshake auth on every reconnect, so without this the first
  // reconnect after a rotation is rejected by the gateway and the socket goes
  // quiet until a full page reload.
  if (!_authWatch) {
    _authWatch = true
    supabase.auth.onAuthStateChange((_event, next) => {
      if (_socket) {
        ;(_socket.auth as { token?: string }).token = next?.access_token
      }
    })
  }

  try {
    return await waitForConnect(socket)
  } catch (err) {
    // Initial connect failed — drop it so the next call starts clean.
    if (_socket === socket) {
      socket.disconnect()
      _socket = null
    }
    throw err
  }
}

function waitForConnect(socket: Socket): Promise<Socket> {
  if (socket.connected) return Promise.resolve(socket)

  return new Promise<Socket>((resolve, reject) => {
    const cleanup = () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onError)
      socket.io.off('reconnect_failed', onFailed)
    }
    const onConnect = () => {
      cleanup()
      resolve(socket)
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const onFailed = () => {
      cleanup()
      reject(new Error('Socket reconnection failed'))
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onError)
    socket.io.on('reconnect_failed', onFailed)
  })
}
