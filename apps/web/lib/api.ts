import { createClient } from './supabase/client'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function authHeaders(body?: BodyInit | null): Promise<Record<string, string>> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    // Don't set Content-Type for FormData — the browser must set it with the multipart boundary
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders(init?.body)
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
