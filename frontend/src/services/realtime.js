import { io } from 'socket.io-client'
import { apiBaseUrl, TOKEN_KEY } from './api'

export function socketOrigin() {
  return apiBaseUrl().replace(/\/api\/?$/, '')
}

/** Socket used by chat and notification listeners; token is read at connect time. */
export function createChatSocket() {
  // Vercel Functions serve WebSocket upgrades but not Socket.IO long-polling.
  const transports = import.meta.env.VITE_WS_ONLY === 'true' ? ['websocket'] : ['websocket', 'polling']
  return io(socketOrigin(), {
    withCredentials: true,
    transports,
    auth: { token: localStorage.getItem(TOKEN_KEY) },
    reconnectionAttempts: 5,
    timeout: 5000,
  })
}
