export function formatEUR(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '–'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(value, options = {}) {
  if (!value) return '–'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '–'
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function truncate(value, length = 80) {
  const text = String(value ?? '')
  if (text.length <= length) return text
  return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…`
}

/** Works with the backend User schema (firstName/lastName) and legacy shapes. */
export function displayName(user) {
  if (!user) return 'Mein Konto'
  const first = user.firstName || user.vorname || ''
  const last = user.lastName || user.nachname || ''
  const full = `${first} ${last}`.trim()
  return full || user.name || user.username || user.email?.split('@')[0] || 'Mein Konto'
}

export const conditionLabels = {
  neu: 'Neu',
  'wie neu': 'Wie neu',
  'sehr gut': 'Sehr gut',
  gut: 'Gut',
  akzeptabel: 'Akzeptabel',
  new: 'Neu',
  'like-new': 'Neuwertig',
  like_new: 'Neuwertig',
  neuwertig: 'Neuwertig',
  'very-good': 'Sehr gut',
  very_good: 'Sehr gut',
  'sehr-gut': 'Sehr gut',
  good: 'Gut',
  'as-new': 'Wie neu',
  fair: 'Zufriedenstellend',
  'used-good': 'Gebraucht – gut',
  used: 'Gebraucht',
  gebraucht: 'Gebraucht',
  defective: 'Defekt',
  for_parts: 'Für Ersatzteile',
}

export function conditionLabel(value) {
  if (!value) return 'Nicht angegeben'
  const key = String(value).trim().toLowerCase()
  return conditionLabels[key] ?? conditionLabels[key.replace(/\s+/g, '-')] ?? String(value)
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function getImageUrl(image) {
  if (!image) return null
  if (typeof image === 'string') return image
  return image.url ?? image.src ?? image.path ?? null
}

export function buildQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item))
    else search.set(key, value)
  })
  return search.toString()
}
