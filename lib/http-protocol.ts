export type HttpProtocol = 'h3' | 'h2' | 'http/1.1' | 'http/1.0' | 'unknown'

/**
 * 归一化 `PerformanceNavigationTiming.nextHopProtocol` 或后端 ALPN 值。
 * 兼容 `h3-29` 这类 HTTP/3 草稿版本。
 */
export function parseHttpProtocol(value: string | null | undefined): HttpProtocol {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return 'unknown'
  if (normalized === 'h3' || normalized.startsWith('h3-')) return 'h3'
  if (normalized === 'h2' || normalized === 'h2c') return 'h2'
  if (normalized === 'http/1.1') return 'http/1.1'
  if (normalized === 'http/1.0') return 'http/1.0'
  return 'unknown'
}

/** 展示名；未知协议返回空串，由调用方决定回退或占位 */
export function httpProtocolLabel(value: string | null | undefined): string {
  switch (parseHttpProtocol(value)) {
    case 'h3':
      return 'HTTP/3'
    case 'h2':
      return 'HTTP/2'
    case 'http/1.1':
      return 'HTTP/1.1'
    case 'http/1.0':
      return 'HTTP/1.0'
    default:
      return ''
  }
}

/** h2 / h3 都属于多路复用协议；评级里的 HTTP/2 项对两者都算通过 */
export function isHttp2OrH3(value: string | null | undefined): boolean {
  const protocol = parseHttpProtocol(value)
  return protocol === 'h2' || protocol === 'h3'
}
