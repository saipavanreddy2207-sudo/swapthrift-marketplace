import api, { toList } from './api'

export const conversationsService = {
  async list() {
    const payload = await api.get('/conversations')
    return toList(payload, 'conversations').map((entry) => (typeof entry === 'object' ? entry : { id: entry }))
  },
  create(productId, receiverId) {
    return api.post('/conversations', { productId, receiverId })
  },
  async messages(conversationId, params = {}) {
    const payload = await api.get(`/conversations/${encodeURIComponent(conversationId)}/messages`, { params })
    return {
      messages: toList(payload, 'messages'),
      pagination: payload?.pagination ?? null,
    }
  },
  send(conversationId, text) {
    return api.post(`/conversations/${encodeURIComponent(conversationId)}/messages`, { text })
  },
  markRead(conversationId) {
    return api.patch(`/conversations/${encodeURIComponent(conversationId)}/read`)
  },
}

export default conversationsService
