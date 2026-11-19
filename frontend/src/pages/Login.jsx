import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!authLoading && isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      success('Willkommen zurück bei SwapThrift!')
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle="Melde dich an und entdecke deine Schätze – oder stelle selbst etwas online."
      footer={
        <p>
          Noch kein Konto?{' '}
          <Link to="/registrieren" className="link-brand">Kostenlos registrieren</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="label" htmlFor="login-email">E-Mail-Adresse</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input pl-10"
              placeholder="deine@email.de"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="login-password">Passwort</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input px-10"
              placeholder="Dein Passwort"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-brand-700"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">Passwort vergessen?</Link>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? 'Anmeldung läuft …' : 'Anmelden'}
        </button>
      </form>
    </AuthShell>
  )
}
