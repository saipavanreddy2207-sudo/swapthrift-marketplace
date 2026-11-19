import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { normaliseProduct } from '../services/products'

/* oxlint-disable react/only-export-components -- provider und Hook gehören zusammen. */
const CartContext = createContext(null)
const STORAGE_KEY = 'swapthrift_cart'

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function itemId(product) {
  return String(product?.id ?? product?._id ?? product?.productId ?? '')
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product, quantity = 1) => {
    const normalised = normaliseProduct(product)
    if (!normalised?.id) return
    setItems((current) => {
      const existing = current.find((item) => itemId(item.product) === itemId(normalised))
      if (existing) {
        return current.map((item) =>
          itemId(item.product) === itemId(normalised)
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item,
        )
      }
      return [...current, { product: normalised, quantity: Math.min(99, Math.max(1, quantity)) }]
    })
  }, [])

  const remove = useCallback((id) => {
    setItems((current) => current.filter((item) => itemId(item.product) !== String(id)))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    const next = Math.min(99, Math.max(1, Number(quantity) || 1))
    setItems((current) =>
      current.map((item) =>
        itemId(item.product) === String(id) ? { ...item, quantity: next } : item,
      ),
    )
  }, [])

  const toggle = useCallback((product) => {
    const id = itemId(product)
    if (!id) return
    setItems((current) =>
      current.some((item) => itemId(item.product) === id)
        ? current.filter((item) => itemId(item.product) !== id)
        : [...current, { product: normaliseProduct(product), quantity: 1 }],
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  /** Used when server-backed carts are introduced; keeps the public API stable. */
  const hydrateFromServer = useCallback((serverItems = []) => {
    if (!Array.isArray(serverItems)) return
    setItems(
      serverItems
        .map((entry) => ({
          product: normaliseProduct(entry.product ?? entry),
          quantity: Number(entry.quantity ?? 1),
        }))
        .filter((entry) => entry.product?.id),
    )
  }, [])

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    return {
      items,
      count,
      itemCount: items.length,
      total,
      add,
      remove,
      updateQuantity,
      toggle,
      clear,
      hydrateFromServer,
      isInCart: (id) => items.some((item) => itemId(item.product) === String(id)),
    }
  }, [items, add, remove, updateQuantity, toggle, clear, hydrateFromServer])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart muss innerhalb eines CartProviders verwendet werden.')
  return context
}

export default CartContext
