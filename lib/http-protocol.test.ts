import { describe, expect, it } from 'vitest'
import { httpProtocolLabel, isHttp2OrH3, parseHttpProtocol } from './http-protocol'

describe('parseHttpProtocol', () => {
  it('recognizes HTTP/3 including draft versions', () => {
    expect(parseHttpProtocol('h3')).toBe('h3')
    expect(parseHttpProtocol('H3')).toBe('h3')
    expect(parseHttpProtocol('h3-29')).toBe('h3')
  })

  it('recognizes HTTP/2', () => {
    expect(parseHttpProtocol('h2')).toBe('h2')
    expect(parseHttpProtocol('h2c')).toBe('h2')
  })

  it('recognizes HTTP/1.x', () => {
    expect(parseHttpProtocol('http/1.1')).toBe('http/1.1')
    expect(parseHttpProtocol('HTTP/1.0')).toBe('http/1.0')
  })

  it('returns unknown for empty or unrecognized values', () => {
    expect(parseHttpProtocol('')).toBe('unknown')
    expect(parseHttpProtocol(null)).toBe('unknown')
    expect(parseHttpProtocol(undefined)).toBe('unknown')
    expect(parseHttpProtocol('quic')).toBe('unknown')
  })
})

describe('httpProtocolLabel', () => {
  it('formats known protocols', () => {
    expect(httpProtocolLabel('h3')).toBe('HTTP/3')
    expect(httpProtocolLabel('h2')).toBe('HTTP/2')
    expect(httpProtocolLabel('http/1.1')).toBe('HTTP/1.1')
    expect(httpProtocolLabel('http/1.0')).toBe('HTTP/1.0')
  })

  it('returns an empty string for unknown protocols', () => {
    expect(httpProtocolLabel('')).toBe('')
    expect(httpProtocolLabel('quic')).toBe('')
  })
})

describe('isHttp2OrH3', () => {
  it('treats h2 and h3 as multiplexed', () => {
    expect(isHttp2OrH3('h3')).toBe(true)
    expect(isHttp2OrH3('h2')).toBe(true)
  })

  it('rejects HTTP/1.x and unknown values', () => {
    expect(isHttp2OrH3('http/1.1')).toBe(false)
    expect(isHttp2OrH3('http/1.0')).toBe(false)
    expect(isHttp2OrH3('')).toBe(false)
    expect(isHttp2OrH3(null)).toBe(false)
  })
})
