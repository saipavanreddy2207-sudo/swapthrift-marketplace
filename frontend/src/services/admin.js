import api, { toList } from './api'

export const adminService = {
  overview() {
    return api.get('/admin/overview')
  },
  async reports(status) {
    const payload = await api.get('/admin/reports', { params: status && status !== 'all' ? { status } : {} })
    return toList(payload, 'reports')
  },
  resolveReport(id, data) {
    return api.patch(`/admin/reports/${encodeURIComponent(id)}`, data)
  },
  async products(status) {
    const payload = await api.get('/admin/products', { params: status && status !== 'all' ? { status } : {} })
    return toList(payload, 'products')
  },
  setProductStatus(id, status) {
    return api.patch(`/admin/products/${encodeURIComponent(id)}/status`, { status })
  },
  async users(params = {}) {
    const payload = await api.get('/admin/users', { params })
    return {
      users: toList(payload, 'users'),
      pagination: payload?.pagination ?? null,
    }
  },
  setUserStatus(id, data) {
    return api.patch(`/admin/users/${encodeURIComponent(id)}/status`, data)
  },
}

export default adminService
