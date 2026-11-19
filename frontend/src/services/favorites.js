import api from './api'

export const favoritesService = {
  async list() {
    const payload = await api.get('/favorites')
    return {
      products: Array.isArray(payload?.products) ? payload.products : [],
      ids: Array.isArray(payload?.ids) ? payload.ids.map(String) : [],
    }
  },
  add(productId) {
    return api.post(`/favorites/${encodeURIComponent(productId)}`)
  },
  remove(productId) {
    return api.delete(`/favorites/${encodeURIComponent(productId)}`)
  },
}

export default favoritesService
