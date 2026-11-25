/** Azərbaycan nömrələrini vahid formata salır: +994 XX XXX XX XX. */
export function formatAzPhone(raw: string): string {
  const input = (raw || '').trim()
  if (!input) return ''
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('994')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)

  if (digits.length !== 9) return input
  return `+994 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}

/** tel: linki üçün yalnız rəqəm və + saxlayır. */
export function telHref(raw: string): string {
  const cleaned = (raw || '').replace(/[^\d+]/g, '')
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}
