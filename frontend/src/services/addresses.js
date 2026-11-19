import api, { toList } from './api'

export const addressesService = {
  async list() {
    const payload = await api.get('/addresses')
    return toList(payload, 'addresses')
  },
  create(data) {
    return api.post('/addresses', data)
  },
  update(id, data) {
    return api.put(`/addresses/${encodeURIComponent(id)}`, data)
  },
  remove(id) {
    return api.delete(`/addresses/${encodeURIComponent(id)}`)
  },
}

export default addressesService
