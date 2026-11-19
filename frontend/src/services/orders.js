import api, { toList } from './api'

export const ordersService = {
  checkout(payload) {
    return api.post('/checkout', payload)
  },
  async list(role = 'buyer') {
    const payload = await api.get('/orders', { params: { role } })
    return toList(payload, 'orders')
  },
  get(id) {
    return api.get(`/orders/${encodeURIComponent(id)}`)
  },
  updateStatus(id, data) {
    return api.patch(`/orders/${encodeURIComponent(id)}/status`, data)
  },
  cancel(id) {
    return api.post(`/orders/${encodeURIComponent(id)}/cancel`)
  },
  createReview(data) {
    return api.post('/reviews', data)
  },
  async reviews(params = {}) {
    const payload = await api.get('/reviews', { params })
    return {
      reviews: toList(payload, 'reviews'),
      summary: {
        average: Number(payload?.summary?.average ?? 0) || 0,
        count: Number(payload?.summary?.count ?? 0) || 0,
      },
    }
  },
  reviewResponse(id, text) {
    return api.patch(`/reviews/${encodeURIComponent(id)}/response`, { text })
  },
}

export default ordersService
