import { describe, expect, it } from 'vitest'
import { parseRetryAfter } from './client'

describe('parseRetryAfter', () => {
  it('parses seconds', () => {
    const response = new Response(null, { headers: { 'retry-after': '42' } })
    expect(parseRetryAfter(response)).toBe(42)
  })

  it('parses an HTTP date', () => {
    const retryAt = new Date(Date.now() + 60_000).toUTCString()
    const response = new Response(null, { headers: { 'retry-after': retryAt } })
    expect(parseRetryAfter(response)).toBeGreaterThan(50)
  })

  it('returns null when the header is absent', () => {
    expect(parseRetryAfter(new Response(null))).toBeNull()
  })
})
