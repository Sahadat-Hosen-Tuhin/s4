export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15 ? digits : ''
}
