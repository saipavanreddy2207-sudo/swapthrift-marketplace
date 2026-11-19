import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService, { storeToken } from '../services/auth'
import { TOKEN_KEY } from '../services/api'

/* oxlint-disable react/only-export-components -- provider und Hook gehören zusammen. */
const AuthContext = createContext(null)

function rolesOf(user) {
  if (!user) return []
  const raw = user.roles ?? user.role ?? []
  return (Array.isArray(raw) ? raw : [raw]).map((role) => String(role).toLowerCase())
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const payload = await authService.me()
      const nextUser = payload?.user ?? payload ?? null
      setUser(nextUser)
      return nextUser
    } catch {
      // Hydration is a synchronisation with the persisted session, not a render update.
      // oxlint-disable-next-line react/set-state-in-effect
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /* oxlint-disable react/set-state-in-effect -- Sitzungs-Hydration ist eine Synchronisierung mit dem gespeicherten Login. */
  useEffect(() => {
    // Runs for both token-based and cookie-based sessions; failures are silent.
    refresh()
  }, [refresh])
  /* oxlint-enable react/set-state-in-effect */

  const login = useCallback(async (email, password) => {
    const payload = await authService.login(email, password)
    if (payload?.token) storeToken(payload.token)
    const nextUser = payload?.user ?? payload ?? null
    setUser(nextUser)
    return nextUser
  }, [])

  const register = useCallback(async (data) => {
    const payload = await authService.register(data)
    if (payload?.token) storeToken(payload.token)
    const nextUser = payload?.user ?? payload ?? null
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      storeToken(null)
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }, [])

  const value = useMemo(() => {
    const roles = rolesOf(user)
    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      isSeller: roles.includes('seller') || roles.includes('verkaeufer') || Boolean(user),
      isAdmin: roles.includes('admin') || roles.includes('administrator'),
      login,
      register,
      logout,
      refresh,
      setUser,
    }
  }, [user, loading, login, register, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden.')
  return context
}

export default AuthContext
