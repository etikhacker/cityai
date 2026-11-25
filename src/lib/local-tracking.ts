const STORAGE_KEY = 'cityai:tracking-codes'
const MAX_ENTRIES = 50

export type SavedTrackingCode = { code: string; savedAt: number }

function isSaved(value: unknown): value is SavedTrackingCode {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.code === 'string' && typeof item.savedAt === 'number'
}

export function readSavedCodes(): SavedTrackingCode[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSaved).sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function writeSavedCodes(items: SavedTrackingCode[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ENTRIES)))
  } catch {
    // Gizli rejim və ya dolu storage — profil sadəcə yaddaşda qalmaz.
  }
}

export function saveTrackingCode(code: string): void {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return
  const rest = readSavedCodes().filter((item) => item.code !== normalized)
  writeSavedCodes([{ code: normalized, savedAt: Date.now() }, ...rest])
}

export function removeSavedCode(code: string): void {
  writeSavedCodes(readSavedCodes().filter((item) => item.code !== code))
}

export function clearSavedCodes(): void {
  writeSavedCodes([])
}
