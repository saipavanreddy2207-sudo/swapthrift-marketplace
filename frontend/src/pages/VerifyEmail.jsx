import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import authService from '../services/auth'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState(token ? 'loading' : 'missing')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true
    authService
      .verifyEmail(token)
      .then(() => {
        setState('success')
        setMessage('Deine E-Mail-Adresse wurde bestätigt. Du kannst jetzt loslegen.')
      })
      .catch((error) => {
        setState('error')
        setMessage(error.message)
      })
  }, [token])

  async function handleResend(event) {
    event.preventDefault()
    if (!email.trim()) return
    try {
      await authService.resendVerification(email.trim())
      setSent(true)
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  return (
    <AuthShell
      title="E-Mail bestätigen"
      subtitle="Ein bestätigter Account hilft uns, SwapThrift sicher zu halten."
      footer={<p>Weiterfrage? <Link to="/login" className="link-brand">Zur Anmeldung</Link></p>}
    >
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10 text-slate-600">
          <Loader2 className="size-8 animate-spin text-brand-600" />
          <p className="text-sm font-semibold">Bestätigung wird geprüft …</p>
        </div>
      )}
      {state === 'success' && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-brand-600" />
          <p className="mt-4 text-sm font-bold text-brand-950">{message}</p>
          <Link to="/dashboard" className="btn-primary mt-6">Zum Dashboard</Link>
        </div>
      )}
      {state === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle className="mx-auto size-10 text-red-600" />
          <p className="mt-4 text-sm font-bold text-red-700">{message}</p>
          <button type="button" onClick={() => setState('missing')} className="btn-outline mt-6">Erneut versuchen</button>
        </div>
      )}
      {state === 'missing' && (
        <div>
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-sand-100 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <p className="text-sm text-brand-950">
              {sent
                ? 'Falls ein Konto zu dieser Adresse existiert, wurde eine neue Bestätigungs-E-Mail versendet.'
                : 'Gib deine E-Mail-Adresse ein, um einen neuen Bestätigungslink anzufordern.'}
            </p>
          </div>
          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="label" htmlFor="verify-email">E-Mail-Adresse</label>
              <input id="verify-email" type="email" required className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="deine@email.de" />
            </div>
            <button type="submit" className="btn-primary w-full">Bestätigungslink anfordern</button>
          </form>
        </div>
      )}
    </AuthShell>
  )
}
