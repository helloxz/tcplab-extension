export interface AppErrorLike {
  /** i18n key，例如 api.rate.limited / whois.error.timeout */
  key: string
  /** API 返回的插值参数 */
  args?: Record<string, unknown>
  /** 服务端 Retry-After，单位秒 */
  retryAfter?: number | null
}

export function isAppError(value: unknown): value is AppErrorLike {
  return typeof value === 'object'
    && value !== null
    && 'key' in value
    && typeof (value as { key?: unknown }).key === 'string'
}
