import type { ApiFailureData, ApiResponse } from './types'

const API_BASE = 'https://tcp.lc/api/v2'
const DEFAULT_TIMEOUT_MS = 20_000

export class ApiError extends Error {
  readonly key: string
  readonly args?: Record<string, unknown>
  readonly retryAfter: number | null
  readonly status: number | null

  constructor(
    key: string,
    options: {
      args?: Record<string, unknown>
      retryAfter?: number | null
      status?: number | null
    } = {},
  ) {
    super(key)
    this.name = 'ApiError'
    this.key = key
    this.args = options.args
    this.retryAfter = options.retryAfter ?? null
    this.status = options.status ?? null
  }
}

export function parseRetryAfter(response: Response): number | null {
  const raw = response.headers.get('retry-after')
  if (!raw) return null

  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds))

  const date = Date.parse(raw)
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000))
  return null
}

async function request<T>(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        ...init.headers,
      },
    })
    const retryAfter = parseRetryAfter(res)

    const text = await res.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      // 非 JSON 响应（边缘错误页等）交给下面的兜底
    }

    if (!res.ok) {
      const msg = typeof body === 'object' && body !== null && 'msg' in body && typeof body.msg === 'string'
        ? body.msg
        : 'api.server.internal'
      throw new ApiError(msg, { retryAfter, status: res.status })
    }

    if (typeof body !== 'object' || body === null) {
      throw new ApiError('errors.invalidResponse', { retryAfter, status: res.status })
    }

    const envelope = body as ApiResponse<T>
    if (envelope.code !== 200) {
      const failure = envelope.data as ApiFailureData | null
      const args = { ...failure?.args }
      // 限流响应有时不带 args，用 Retry-After 补齐插值
      if (envelope.msg === 'api.rate.limited' && args.seconds == null && retryAfter != null) {
        args.seconds = retryAfter
      }
      throw new ApiError(envelope.msg || 'api.server.internal', {
        args,
        retryAfter,
        status: res.status,
      })
    }

    return envelope.data as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      throw new ApiError('errors.timeout')
    }
    throw new ApiError('errors.network')
  } finally {
    clearTimeout(timer)
  }
}

export function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return request<T>(url.toString(), { method: 'GET' })
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}
