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
  // A 204 has no body, so res.json() would throw on it. DELETE endpoints and
  // anything else that returns nothing resolve to undefined instead.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

/**
 * Builds a query string, dropping anything empty so the API's
 * `forbidNonWhitelisted` validation never sees a blank filter it must reject.
 */
export function queryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Turns an ApiError into something worth showing a person.
 *
 * Nest sends validation failures as a JSON body whose `message` is either a
 * string or an array of them, and ApiError carries that body verbatim. This was
 * previously inlined in the onboarding page; the admin forms need the same
 * treatment on every save.
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { message?: string | string[] }
      if (typeof parsed.message === 'string') return parsed.message
      if (Array.isArray(parsed.message)) return parsed.message.join(', ')
    } catch {
      if (err.message) return err.message
    }
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
