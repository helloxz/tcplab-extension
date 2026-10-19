import { describe, expect, it } from 'vitest'
import { classifyUrl } from './url'

describe('classifyUrl', () => {
  it('accepts public http/https pages', () => {
    expect(classifyUrl('https://example.com').kind).toBe('supported')
    expect(classifyUrl('http://example.com/path?q=1').kind).toBe('supported')
    expect(classifyUrl('https://example.com:8443/path')).toMatchObject({
      kind: 'supported',
      hostname: 'example.com',
      protocol: 'https:',
      port: 8443,
      isIp: false,
    })
  })

  it('accepts public IP literals', () => {
    expect(classifyUrl('https://1.1.1.1')).toMatchObject({
      kind: 'supported',
      isIp: true,
      ipVersion: 4,
    })
    expect(classifyUrl('https://[2606:4700:4700::1111]/')).toMatchObject({
      kind: 'supported',
      isIp: true,
      ipVersion: 6,
    })
  })

  it('rejects blank and browser-internal pages', () => {
    expect(classifyUrl(undefined)).toEqual({ kind: 'unsupported', reason: 'blank' })
    expect(classifyUrl('about:blank')).toEqual({ kind: 'unsupported', reason: 'blank' })
    expect(classifyUrl('chrome://newtab/')).toEqual({ kind: 'unsupported', reason: 'internal' })
    expect(classifyUrl('view-source:https://example.com')).toEqual({
      kind: 'unsupported',
      reason: 'internal',
    })
    expect(classifyUrl('data:text/html,hello')).toEqual({ kind: 'unsupported', reason: 'internal' })
  })

  it('rejects private and local addresses', () => {
    for (const url of [
      'http://192.168.1.1',
      'http://10.0.0.1',
      'http://172.16.0.1',
      'http://127.0.0.1',
      'http://100.64.0.1',
      'http://localhost:3000',
      'http://router',
      'http://foo.local',
      'https://[::1]/',
      'https://[fe80::1]/',
      'https://[fc00::1]/',
      'https://[::ffff:192.168.1.1]/',
    ]) {
      expect(classifyUrl(url), url).toEqual({ kind: 'unsupported', reason: 'local' })
    }
  })

  it('rejects non-web schemes and invalid URLs', () => {
    expect(classifyUrl('file:///tmp/a.txt')).toEqual({ kind: 'unsupported', reason: 'local' })
    expect(classifyUrl('ftp://example.com')).toEqual({ kind: 'unsupported', reason: 'internal' })
    expect(classifyUrl('not a url')).toEqual({ kind: 'unsupported', reason: 'invalid' })
  })
})
