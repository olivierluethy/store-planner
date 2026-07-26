// Central fetch wrapper: injects the bearer token, normalises the API's error
// envelope into ApiError, and triggers auto-logout on a 401 for authed calls.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export interface ApiFieldErrors {
  [field: string]: string
}

export class ApiError extends Error {
  code: string
  status: number
  fields?: ApiFieldErrors

  constructor(status: number, code: string, message: string, fields?: ApiFieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

let authToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const sentToken = authToken
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (sentToken) headers['Authorization'] = `Bearer ${sentToken}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network_error', 'Keine Verbindung zum Server.')
  }

  const text = await res.text()
  const data = text ? safeParse(text) : null

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; fields?: ApiFieldErrors } } | null)?.error
    if (res.status === 401 && sentToken && unauthorizedHandler) {
      unauthorizedHandler()
    }
    throw new ApiError(
      res.status,
      err?.code ?? 'error',
      err?.message ?? `Fehler ${res.status}.`,
      err?.fields,
    )
  }

  return data as T
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
