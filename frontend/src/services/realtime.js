import { io } from 'socket.io-client'
import { apiBaseUrl, TOKEN_KEY } from './api'

export function socketOrigin() {
  return apiBaseUrl().replace(/\/api\/?$/, '')
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
