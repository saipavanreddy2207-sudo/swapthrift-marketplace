import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async function and exposes { data, loading, error, refetch }.
 * `deps` controls when the automatic request re-runs.
 */
export function useApi(asyncFn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const fnRef = useRef(asyncFn)
  fnRef.current = asyncFn

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      setData(result)
      return result
    } catch (err) {
      setError(err)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, ...deps])

  return { data, loading, error, refetch: execute, setData }
}

/** Debounce a rapidly changing value (e.g. a search field). */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default useApi
