/**
 * İzləmə kodu formatı.
 * Yeni kodlar: AZE-XXXXXXXX (8 simvol, qarışıq hərflər çıxarılıb).
 * Köhnə kodlar: MZB-<32 hex> və MZB-<6> — hələ də qəbul olunur.
 */
export const TRACKING_PREFIX = 'AZE'

// 0, 1, I, L, O, U çıxarılıb — telefonda/kağızda səhv oxunmasın.
export const TRACKING_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
export const TRACKING_CODE_LENGTH = 8

const NEW_CODE = /^AZE-[2-9A-HJ-NP-Z]{8}$/
const LEGACY_LONG = /^(?:AZE|MZB)-[A-F0-9]{32}$/
const LEGACY_SHORT = /^MZB-[A-Z0-9]{6}$/

export function normalizeTrackingCode(value: string): string {
  return value.trim().toUpperCase()
}

export function isValidTrackingCode(value: string): boolean {
  const code = normalizeTrackingCode(value)
  return NEW_CODE.test(code) || LEGACY_LONG.test(code) || LEGACY_SHORT.test(code)
}

/** Yalnız serverdə istifadə olunur; kriptoqrafik təsadüfi bayt tələb edir. */
export function buildTrackingCode(bytes: Uint8Array): string {
  let suffix = ''
  for (let index = 0; index < TRACKING_CODE_LENGTH; index += 1) {
    suffix += TRACKING_ALPHABET[bytes[index] % TRACKING_ALPHABET.length]
  }
  return TRACKING_PREFIX + '-' + suffix
}
