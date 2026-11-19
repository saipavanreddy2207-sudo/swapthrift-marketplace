import axios from 'axios'

export const TOKEN_KEY = 'swapthrift_token'

/** Runtime override from /config.js, then build-time env, then local default. */
export function apiBaseUrl() {
  const runtime = typeof window !== 'undefined' ? window.__SWAPTHRIFT_API_URL__ : ''
  return runtime || import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
}

const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload && typeof payload === 'object' && payload.success === false) {
      throw new Error(payload.message || 'Die Anfrage konnte nicht abgeschlossen werden.')
    }
    if (
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, 'success') &&
      Object.prototype.hasOwnProperty.call(payload, 'data')
    ) {
      return payload.data
    }
    return payload
  },
  (error) => {
    const data = error.response?.data
    let message = data?.message || data?.error

    if (!message && data && typeof data === 'object') {
      const firstError = Object.values(data).find(
        (value) => typeof value === 'string' || (Array.isArray(value) && value.length),
      )
      if (typeof firstError === 'string') message = firstError
      else if (Array.isArray(firstError)) message = firstError.join(', ')
    }

    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.'
      else if (!error.response) message = 'Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung.'
      else message = `Es ist ein Fehler aufgetreten (${error.response.status}).`
    }

    const wrapped = new Error(message)
    wrapped.status = error.response?.status
    wrapped.response = error.response
    wrapped.originalError = error
    return Promise.reject(wrapped)
  },
)

/** Extract an array from a variety of common list response shapes. */
export function toList(payload, ...keys) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  for (const key of [...keys, 'products', 'categories', 'items', 'results', 'data']) {
    if (Array.isArray(payload[key])) return payload[key]
  }
  return []
}

/** Normalise paginated responses so pages can read `{ items, pagination }`. */
export function toPaginated(payload, ...keys) {
  const items = toList(payload, ...keys)
  const pagination =
    payload?.pagination ||
    payload?.meta?.pagination ||
    payload?.meta ||
    (typeof payload?.total === 'number'
      ? { total: payload.total, page: payload.page, pages: payload.pages || payload.totalPages }
      : null)
  return { items, pagination }
}

export { api as default, api }
