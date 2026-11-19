import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import authService from '../services/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Passwort vergessen?"
      subtitle="Wir senden dir einen Link, mit dem du dein Passwort zurücksetzen kannst."
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="size-4" /> Zurück zur Anmeldung
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <Mail className="mx-auto size-10 text-brand-600" />
          <p className="mt-4 text-sm font-bold text-brand-950">
            Falls zu <span className="break-all">{email}</span> ein Konto existiert, wurde eine E-Mail versendet.
          </p>
          <p className="mt-2 text-sm text-slate-600">Bitte prüfe auch deinen Spam-Ordner.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <div>
            <label className="label" htmlFor="forgot-email">E-Mail-Adresse</label>
            <input id="forgot-email" type="email" required className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="deine@email.de" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? 'Wird gesendet …' : 'Link anfordern'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
