import api, { toList } from './api'

export const notificationsService = {
  async list(unreadOnly = false) {
    const payload = await api.get('/notifications', {
      params: unreadOnly ? { unreadOnly: true } : {},
    })
    return {
      notifications: toList(payload, 'notifications'),
      unreadCount: Number(payload?.unreadCount ?? 0) || 0,
    }
  },
  markRead(id) {
    return api.patch(`/notifications/${encodeURIComponent(id)}/read`)
  },
  markAllRead() {
    return api.patch('/notifications/read-all')
  },
  remove(id) {
    return api.delete(`/notifications/${encodeURIComponent(id)}`)
  },
}

export default notificationsService
