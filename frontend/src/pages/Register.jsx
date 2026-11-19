import { Check, Eye, EyeOff, LockKeyhole, Mail, MapPin, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  city: '',
  postalCode: '',
  phone: '',
  terms: false,
  privacy: false,
}

export default function Register() {
  const { register } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function validate() {
    if (form.firstName.trim().length < 2) return 'Bitte gib deinen Vornamen an.'
    if (form.lastName.trim().length < 2) return 'Bitte gib deinen Nachnamen an.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Bitte gib eine gültige E-Mail-Adresse an.'
    if (form.password.length < 8) return 'Das Passwort muss mindestens 8 Zeichen lang sein.'
    if (form.password !== form.passwordConfirmation) return 'Die Passwörter stimmen nicht überein.'
    if (!form.city.trim()) return 'Bitte gib deinen Ort an.'
    if (!/^\d{5}$/.test(form.postalCode.trim())) return 'Bitte gib eine gültige fünfstellige Postleitzahl ein.'
    if (!form.terms) return 'Bitte akzeptiere die AGB, um fortzufahren.'
    if (!form.privacy) return 'Bitte stimme der Datenschutzerklärung zu.'
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setBusy(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        phone: form.phone.trim() || undefined,
        terms: form.terms,
        privacy: form.privacy,
      })
      success('Dein Konto wurde erstellt. Willkommen bei SwapThrift!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Kostenlos registrieren"
      subtitle="Nur ein paar Angaben – dann kannst du Schätze finden und selbst verkaufen."
      footer={
        <p>
          Du hast schon ein Konto? <Link to="/login" className="link-brand">Hier anmelden</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="register-first-name">Vorname</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input id="register-first-name" className="input pl-10" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Vorname" autoComplete="given-name" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="register-last-name">Nachname</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input id="register-last-name" className="input pl-10" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Nachname" autoComplete="family-name" />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="register-email">E-Mail-Adresse</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input id="register-email" type="email" className="input pl-10" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="deine@email.de" autoComplete="email" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="register-password">Passwort</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input id="register-password" type={showPassword ? 'text' : 'password'} className="input px-10" required value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mind. 8 Zeichen" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-brand-700">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="register-confirm">Passwort wiederholen</label>
            <input id="register-confirm" type={showPassword ? 'text' : 'password'} className="input" required value={form.passwordConfirmation} onChange={(e) => update('passwordConfirmation', e.target.value)} placeholder="Passwort erneut eingeben" autoComplete="new-password" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="register-city">Ort</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <input id="register-city" className="input pl-10" required value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="z. B. Berlin" autoComplete="address-level2" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="register-zip">Postleitzahl</label>
            <input id="register-zip" inputMode="numeric" maxLength={5} className="input" required value={form.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} placeholder="10115" autoComplete="postal-code" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="register-phone">Telefonnummer <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="register-phone" type="tel" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+49 …" autoComplete="tel" />
        </div>
        <div className="space-y-3 pt-1">
          <Checkbox id="register-terms" checked={form.terms} onChange={(checked) => update('terms', checked)} label={<>Ich akzeptiere die <Link to="/rechtliches/agb" className="link-brand" target="_blank">AGB</Link> und die <Link to="/rechtliches/marktplatzregeln" className="link-brand" target="_blank">Marktplatzregeln</Link>.</>} />
          <Checkbox id="register-privacy" checked={form.privacy} onChange={(checked) => update('privacy', checked)} label={<>Ich habe die <Link to="/rechtliches/datenschutz" className="link-brand" target="_blank">Datenschutzerklärung</Link> gelesen und stimme ihr zu.</>} />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </button>
      </form>
    </AuthShell>
  )
}

function Checkbox({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-600">
      <span className="relative mt-0.5 shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span className="grid size-5 place-items-center rounded-md border border-slate-300 bg-white text-white transition-colors peer-checked:border-brand-700 peer-checked:bg-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400">
          {checked && <Check className="size-3.5" />}
        </span>
      </span>
      <span>{label}</span>
    </label>
  )
}
