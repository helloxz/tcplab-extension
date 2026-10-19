import { describe, expect, it } from 'vitest'
import { tlsVersionGrade } from './tls-grade'

describe('tlsVersionGrade', () => {
  it('marks TLS 1.3 as modern', () => {
    expect(tlsVersionGrade('TLSv1.3')).toBe('modern')
  })

  it('marks TLS 1.2 as acceptable', () => {
    expect(tlsVersionGrade('TLSv1.2')).toBe('acceptable')
  })

  it('marks deprecated protocols', () => {
    expect(tlsVersionGrade('TLSv1.1')).toBe('deprecated')
    expect(tlsVersionGrade('TLSv1')).toBe('deprecated')
    expect(tlsVersionGrade('SSLv3')).toBe('deprecated')
  })

  it('returns unknown for missing or unrecognized versions', () => {
    expect(tlsVersionGrade(null)).toBe('unknown')
    expect(tlsVersionGrade('')).toBe('unknown')
    expect(tlsVersionGrade('QUIC')).toBe('unknown')
  })
})
