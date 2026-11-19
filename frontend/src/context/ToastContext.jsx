import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/* oxlint-disable react/only-export-components -- provider und Hook gehören zusammen. */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'success', duration = 4000) => {
      const id = ++counter.current
      setToasts((current) => [...current, { id, message, type }])
      if (duration > 0) window.setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismiss,
      success: (message) => showToast(message, 'success'),
      error: (message) => showToast(message, 'error'),
      info: (message) => showToast(message, 'info'),
    }),
    [toasts, showToast, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast muss innerhalb eines ToastProviders verwendet werden.')
  return context
}

export default ToastContext
