import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import favoritesService from '../services/favorites'
import { normaliseProduct } from '../services/products'
import { apiErrorMessage } from '../utils/apiError'

/* oxlint-disable react/only-export-components -- provider und Hook gehören zusammen. */
const FavoritesContext = createContext(null)
const STORAGE_KEY = 'swapthrift_favorites'

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function productId(product) {
  if (product && typeof product === 'object') {
    return String(product.id ?? product._id ?? product.productId ?? '')
  }
  return String(product ?? '')
}

function addItem(items, product) {
  const id = productId(product)
  if (!id) return items
  return items.some((item) => productId(item) === id) ? items : [product, ...items]
}

function removeItem(items, id) {
  return items.filter((item) => productId(item) !== String(id))
}

function fromServer(products) {
  return (Array.isArray(products) ? products : []).map(normaliseProduct).filter((item) => item?.id)
}

export function FavoritesProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { error: toastError } = useToast()
  const [items, setItems] = useState(readStorage)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)
  const idsRef = useRef(new Set(items.map(productId)))
  const pendingRef = useRef(new Set())

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    idsRef.current = new Set(items.map(productId))
    if (!isAuthenticated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch {
        // Private-mode storage failures must not break the UI.
      }
    }
  }, [items, isAuthenticated])

  /* oxlint-disable react/set-state-in-effect -- Favoriten werden beim Wechsel der Sitzung mit dem Backend synchronisiert. */
  useEffect(() => {
    if (authLoading) return undefined
    let active = true
    if (!isAuthenticated) {
      const stored = readStorage()
      idsRef.current = new Set(stored.map(productId))
      setItems(stored)
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)
    favoritesService
      .list()
      .then(({ products }) => {
        if (!active) return
        const serverItems = fromServer(products)
        idsRef.current = new Set(serverItems.map(productId))
        setItems(serverItems)
      })
      .catch((error) => {
        if (!active || error?.status === 401) return
        toastError(apiErrorMessage(error, 'Favoriten konnten nicht geladen werden.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAuthenticated, authLoading, toastError])
  /* oxlint-enable react/set-state-in-effect */

  const add = useCallback(
    async (product) => {
      const id = productId(product)
      if (!id || pendingRef.current.has(id) || idsRef.current.has(id)) return
      pendingRef.current.add(id)
      const entry = normaliseProduct(product) ?? { id }
      setItems((current) => addItem(current, entry))
      idsRef.current.add(id)
      if (!isAuthenticated) {
        pendingRef.current.delete(id)
        return
      }
      try {
        await favoritesService.add(id)
      } catch (error) {
        setItems((current) => removeItem(current, id))
        idsRef.current.delete(id)
        toastError(apiErrorMessage(error, 'Favorit konnte nicht gespeichert werden.'))
      } finally {
        pendingRef.current.delete(id)
      }
    },
    [isAuthenticated, toastError],
  )

  const remove = useCallback(
    async (id) => {
      const key = String(id)
      if (!key || pendingRef.current.has(key) || !idsRef.current.has(key)) return
      pendingRef.current.add(key)
      const previous = items.find((item) => productId(item) === key)
      setItems((current) => removeItem(current, key))
      idsRef.current.delete(key)
      if (!isAuthenticated) {
        pendingRef.current.delete(key)
        return
      }
      try {
        await favoritesService.remove(key)
      } catch (error) {
        setItems((current) => addItem(current, previous ?? { id: key }))
        idsRef.current.add(key)
        toastError(apiErrorMessage(error, 'Favorit konnte nicht entfernt werden.'))
      } finally {
        pendingRef.current.delete(key)
      }
    },
    [isAuthenticated, toastError, items],
  )

  const toggle = useCallback(
    (product) => {
      const id = productId(product)
      const willBeSaved = !idsRef.current.has(id)
      if (willBeSaved) add(product)
      else remove(id)
      return willBeSaved
    },
    [add, remove],
  )

  const clear = useCallback(async () => {
    const ids = [...idsRef.current]
    setItems([])
    idsRef.current = new Set()
    if (!isAuthenticated || ids.length === 0) return
    try {
      const results = await Promise.allSettled(ids.map((id) => favoritesService.remove(id)))
      if (results.some((result) => result.status === 'rejected')) {
        const { products } = await favoritesService.list()
        if (mountedRef.current) {
          const serverItems = fromServer(products)
          idsRef.current = new Set(serverItems.map(productId))
          setItems(serverItems)
        }
        toastError('Einige Favoriten konnten nicht entfernt werden.')
      }
    } catch (error) {
      toastError(apiErrorMessage(error, 'Favoriten konnten nicht geleert werden.'))
    }
  }, [isAuthenticated, toastError])

  const hydrateFromServer = useCallback((serverItems = []) => {
    const next = fromServer(serverItems)
    idsRef.current = new Set(next.map(productId))
    setItems(next)
  }, [])

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      ids: items.map(productId),
      loading,
      add,
      remove,
      toggle,
      clear,
      hydrateFromServer,
      isFavorite: (id) => idsRef.current.has(String(id)),
    }),
    [items, loading, add, remove, toggle, clear, hydrateFromServer],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites muss innerhalb eines FavoritesProviders verwendet werden.')
  return context
}

export default FavoritesContext
