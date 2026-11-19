import { Camera, LockKeyhole, Mail, Save, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import authService from '../services/auth'
import { displayName, formatDate } from '../utils/format'

export default function Profile() {
  const { user, refresh, logout } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [prefs, setPrefs] = useState({
    email: {
      messages: user?.notificationPreferences?.email?.messages ?? true,
      offers: user?.notificationPreferences?.email?.offers ?? false,
      newsletter: user?.notificationPreferences?.email?.newsletter ?? false,
    },
    inApp: {
      messages: user?.notificationPreferences?.inApp?.messages ?? true,
      offers: user?.notificationPreferences?.inApp?.offers ?? false,
    },
  })
  const [confirmDelete, setConfirmDelete] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function run(key, task, done) {
    setBusy(key)
    setMessage('')
    try {
      await task()
      await refresh()
      success(done)
      setMessage(done)
    } catch (error) {
      toastError(error.message)
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  function handleProfile(event) {
    event.preventDefault()
    run('profile', () => authService.updateProfile(form), 'Dein Profil wurde gespeichert.')
  }

  function handlePassword(event) {
    event.preventDefault()
    run(
      'password',
      () => authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
      'Dein Passwort wurde geändert.',
    )
    setPasswordForm({ currentPassword: '', newPassword: '' })
  }

  function handleEmail(event) {
    event.preventDefault()
    run(
      'email',
      () => authService.changeEmail(emailForm.newEmail, emailForm.password),
      'E-Mail-Adresse geändert. Bitte bestätige die neue Adresse.',
    )
    setEmailForm({ newEmail: '', password: '' })
  }

  function handleAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    run('avatar', () => authService.uploadAvatar(file), 'Dein Profilbild wurde aktualisiert.')
    event.target.value = ''
  }

  function handlePrefs() {
    run('prefs', () => authService.updateProfile({ notificationPreferences: prefs }), 'Benachrichtigungseinstellungen gespeichert.')
  }

  async function handleDelete(event) {
    event.preventDefault()
    if (confirmDelete.trim().toUpperCase() !== 'LÖSCHEN') {
      toastError('Bitte gib LÖSCHEN ein, um dein Konto zu löschen.')
      return
    }
    setBusy('delete')
    try {
      await authService.deleteAccount()
      success('Dein Konto wurde gelöscht.')
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      toastError(error.message)
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Mein Konto</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Profil &amp; Einstellungen</h1>

      {message && (
        <div role="status" className="mt-5 rounded-xl bg-sand-100 px-4 py-3 text-sm font-semibold text-brand-900">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="card h-fit p-6 text-center">
          <div className="mx-auto grid size-24 place-items-center overflow-hidden rounded-full bg-brand-100 text-brand-800">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="Profilbild" className="size-full object-cover" />
            ) : (
              <UserRound className="size-10" />
            )}
          </div>
          <label className="btn-outline mt-4 inline-flex cursor-pointer">
            <Camera className="size-4" /> {busy === 'avatar' ? 'Wird hochgeladen …' : 'Profilbild ändern'}
            <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
          </label>
          <p className="mt-5 text-lg font-extrabold text-brand-950">{displayName(user)}</p>
          <p className="mt-1 break-all text-sm text-slate-500">{user?.email}</p>
          {user?.createdAt && (
            <p className="mt-3 text-xs text-slate-500">
              Dabei seit {formatDate(user.createdAt, { month: 'short', year: 'numeric' })}
            </p>
          )}
          {user?.isEmailVerified && (
            <p className="mt-2 text-xs font-bold text-brand-700">✓ E-Mail bestätigt</p>
          )}
        </aside>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-extrabold">Persönliche Angaben</h2>
            <form onSubmit={handleProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="profile-first-name">Vorname</label>
                <input id="profile-first-name" className="input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="profile-last-name">Nachname</label>
                <input id="profile-last-name" className="input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="profile-city">Ort</label>
                <input id="profile-city" className="input" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="profile-zip">Postleitzahl</label>
                <input id="profile-zip" className="input" inputMode="numeric" maxLength={5} value={form.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="profile-phone">Telefonnummer</label>
                <input id="profile-phone" type="tel" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="profile-bio">Über mich</label>
                <textarea id="profile-bio" rows={3} maxLength={1000} className="input" value={form.bio} onChange={(e) => update('bio', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={Boolean(busy)} className="btn-primary">
                  <Save className="size-4" /> {busy === 'profile' ? 'Wird gespeichert …' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><LockKeyhole className="size-5 text-brand-600" /> Passwort ändern</h2>
            <form onSubmit={handlePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="password-current">Aktuelles Passwort</label>
                <input id="password-current" type="password" required className="input" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="password-new">Neues Passwort</label>
                <input id="password-new" type="password" required minLength={8} className="input" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={Boolean(busy)} className="btn-primary">Passwort aktualisieren</button>
              </div>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Mail className="size-5 text-brand-600" /> E-Mail-Adresse ändern</h2>
            <form onSubmit={handleEmail} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email-new">Neue E-Mail-Adresse</label>
                <input id="email-new" type="email" required className="input" value={emailForm.newEmail} onChange={(e) => setEmailForm((c) => ({ ...c, newEmail: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="email-password">Passwort zur Bestätigung</label>
                <input id="email-password" type="password" required className="input" value={emailForm.password} onChange={(e) => setEmailForm((c) => ({ ...c, password: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={Boolean(busy)} className="btn-primary">E-Mail-Adresse ändern</button>
              </div>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-extrabold">Benachrichtigungen</h2>
            <div className="mt-5 space-y-3">
              {[
                { group: 'email', key: 'messages', label: 'Neue Nachrichten per E-Mail' },
                { group: 'email', key: 'offers', label: 'Angebote & Empfehlungen per E-Mail' },
                { group: 'email', key: 'newsletter', label: 'SwapThrift Newsletter' },
                { group: 'inApp', key: 'messages', label: 'Nachrichten in der App' },
                { group: 'inApp', key: 'offers', label: 'Angebote in der App' },
              ].map(({ group, key, label }) => (
                <label key={`${group}-${key}`} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-700"
                    checked={prefs[group][key]}
                    onChange={(e) => setPrefs((current) => ({ ...current, [group]: { ...current[group], [key]: e.target.checked } }))}
                  />
                  {label}
                </label>
              ))}
              <button type="button" onClick={handlePrefs} disabled={Boolean(busy)} className="btn-outline mt-2">Einstellungen speichern</button>
            </div>
          </section>

          <section className="card border-red-200 p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-red-700"><Trash2 className="size-5" /> Konto löschen</h2>
            <p className="mt-2 text-sm text-slate-600">
              Dein Konto wird deaktiviert und personenbezogene Daten werden anonymisiert. Bestellungen bleiben aus Buchhaltungsgründen erhalten.
            </p>
            <form onSubmit={handleDelete} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="input sm:max-w-52"
                placeholder="LÖSCHEN eingeben"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
              />
              <button type="submit" disabled={Boolean(busy)} className="btn-outline border-red-300 text-red-700">
                Konto endgültig löschen
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
