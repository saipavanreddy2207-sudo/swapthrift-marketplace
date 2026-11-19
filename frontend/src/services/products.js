import api, { toList, toPaginated } from './api'

export const productsService = {
  async list(params = {}) {
    const payload = await api.get('/products', { params })
    return toPaginated(payload, 'products')
  },
  async get(id) {
    const payload = await api.get(`/products/${encodeURIComponent(id)}`)
    return payload?.product ?? payload
  },
  create(formData) {
    return api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  update(id, formData) {
    return api.put(`/products/${encodeURIComponent(id)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  remove(id) {
    return api.delete(`/products/${encodeURIComponent(id)}`)
  },
  async related(params = {}) {
    const payload = await api.get('/products', { params })
    return toList(payload, 'products')
  },
  report(id, report) {
    const body = typeof report === 'string' ? { reason: report } : report
    return api.post(`/products/${encodeURIComponent(id)}/report`, body)
  },
}

/** Accept both common product shapes so UI components stay resilient. */
export function normaliseProduct(product) {
  if (!product || typeof product !== 'object') return null
  return {
    ...product,
    id: product.id ?? product._id,
    title: product.title ?? product.name ?? 'Ohne Titel',
    price: Number(product.price ?? 0),
    images: product.images ?? (product.image ? [product.image] : []),
    city: product.city ?? product.location?.city ?? '',
    postalCode: product.postalCode ?? product.zip ?? product.location?.postalCode ?? '',
    condition: product.condition ?? '',
    category: product.category ?? null,
    seller: product.seller ?? product.user ?? null,
  }
}

export default productsService
