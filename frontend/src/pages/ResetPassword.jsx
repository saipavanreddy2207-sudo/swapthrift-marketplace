import { CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import authService from '../services/auth'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!token) {
      setError('Der Rücksetzlink ist ungültig oder unvollständig.')
      return
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirmation) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await authService.resetPassword(token, password, confirmation)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Neues Passwort setzen"
      subtitle="Wähle ein sicheres Passwort mit mindestens acht Zeichen."
      footer={<Link to="/login" className="link-brand">Zur Anmeldung</Link>}
    >
      {done ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-brand-600" />
          <p className="mt-4 text-sm font-bold text-brand-950">Dein Passwort wurde aktualisiert.</p>
          <Link to="/login" className="btn-primary mt-6">Jetzt anmelden</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <div>
            <label className="label" htmlFor="reset-password">Neues Passwort</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input id="reset-password" type={showPassword ? 'text' : 'password'} className="input px-10" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mind. 8 Zeichen" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-brand-700">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reset-confirm">Passwort wiederholen</label>
            <input id="reset-confirm" type={showPassword ? 'text' : 'password'} className="input" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Passwort erneut eingeben" autoComplete="new-password" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? 'Passwort wird gespeichert …' : 'Passwort speichern'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
