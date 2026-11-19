import { io } from 'socket.io-client'
import { TOKEN_KEY } from './api'

export function socketOrigin() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
}

/** Socket used by chat and notification listeners; token is read at connect time. */
export function createChatSocket() {
  return io(socketOrigin(), {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: { token: localStorage.getItem(TOKEN_KEY) },
    reconnectionAttempts: 5,
    timeout: 5000,
  })
}
