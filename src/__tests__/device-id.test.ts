import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/device-id'

describe('getClientIp', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18' },
    })
    expect(getClientIp(req)).toBe('203.0.113.1')
  })

  it('trims whitespace from IP', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  10.0.0.1 , 192.168.1.1' },
    })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('returns single IP when no comma', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.0.1' },
    })
    expect(getClientIp(req)).toBe('192.168.0.1')
  })

  it('returns 127.0.0.1 when header is missing', () => {
    const req = new Request('http://localhost')
    expect(getClientIp(req)).toBe('127.0.0.1')
  })
})
