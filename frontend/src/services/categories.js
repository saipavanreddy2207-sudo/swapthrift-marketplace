import api, { toList } from './api'

const FALLBACK_CATEGORIES = []

export const categoriesService = {
  async list() {
    try {
      const payload = await api.get('/categories')
      return toList(payload, 'categories').map(normaliseCategory)
    } catch {
      // The marketplace UI stays usable while the catalogue API is unavailable.
      return FALLBACK_CATEGORIES
    }
  },
  async get(id) {
    return api.get(`/categories/${encodeURIComponent(id)}`)
  },
}

export function normaliseCategory(category) {
  if (typeof category === 'string') {
    return { id: category, slug: category, name: category, count: 0, icon: 'package' }
  }
  return {
    ...category,
    id: category.id ?? category._id ?? category.slug,
    name: category.name ?? category.title ?? 'Kategorie',
    slug: category.slug ?? category.name,
    count: Number(category.count ?? category.productCount ?? 0),
    subcategories: category.subcategories ?? [],
  }
}

export default categoriesService
