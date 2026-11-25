import { describe, expect, it } from 'vitest'
import { buildTrackingCode, isValidTrackingCode, normalizeTrackingCode, TRACKING_CODE_LENGTH } from './tracking-code'

describe('tracking codes', () => {
  it('builds an eight character AZE code', () => {
    const bytes = new Uint8Array(TRACKING_CODE_LENGTH).fill(7)
    const code = buildTrackingCode(bytes)
    expect(code).toMatch(/^AZE-[2-9A-HJ-NP-Z]{8}$/)
    expect(isValidTrackingCode(code)).toBe(true)
  })

  it('avoids visually ambiguous characters', () => {
    const alphabet = new Set<string>()
    for (let index = 0; index < 256; index += 1) {
      const bytes = new Uint8Array(TRACKING_CODE_LENGTH).fill(index)
      alphabet.add(buildTrackingCode(bytes).slice(4))
    }
    const joined = [...alphabet].join('')
    for (const char of ['0', '1', 'I', 'L', 'O', 'U']) expect(joined).not.toContain(char)
  })

  it('normalizes lowercase input', () => {
    expect(normalizeTrackingCode('  aze-abcdefgh ')).toBe('AZE-ABCDEFGH')
  })

  it('still accepts legacy MZB codes', () => {
    expect(isValidTrackingCode('MZB-9BE8C6')).toBe(true)
    expect(isValidTrackingCode('MZB-9BE8C681A6F979B86802FBABDE74F795'.toUpperCase())).toBe(true)
    expect(isValidTrackingCode('AZE-9BE8C681A6F979B86802FBABDE74F795')).toBe(true)
  })

  it('rejects unknown prefixes and wrong lengths', () => {
    expect(isValidTrackingCode('ABC-ABCDEFGH')).toBe(false)
    expect(isValidTrackingCode('AZE-ABCDEFG')).toBe(false)
    expect(isValidTrackingCode('AZE-ABCDEFGHI')).toBe(false)
    expect(isValidTrackingCode('')).toBe(false)
  })
})
