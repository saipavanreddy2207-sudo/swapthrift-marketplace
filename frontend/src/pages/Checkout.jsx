import { ArrowLeft, CheckCircle2, Info, LockKeyhole, MapPin, ShoppingBag, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useCart } from '../context/CartContext'
import ordersService from '../services/orders'
import { apiErrorMessage } from '../utils/apiError'
import { getId } from '../utils/entities'
import { formatEUR } from '../utils/format'

const initialAddress = {
  firstName: '',
  lastName: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'Deutschland',
}

export default function Checkout() {
  const { items, total, clear } = useCart()
  const [address, setAddress] = useState(initialAddress)
  const [shipping, setShipping] = useState('versand')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  function update(field, value) {
    setAddress((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const required = ['firstName', 'lastName', 'street', 'houseNumber', 'postalCode', 'city', 'country']
    if (required.some((field) => !address[field].trim()) || !/^\d{5}$/.test(address.postalCode)) {
      setError('Bitte fülle alle Pflichtfelder aus und gib eine gültige fünfstellige Postleitzahl an.')
      return
    }
    if (items.length === 0) {
      setError('Dein Warenkorb ist leer. Bitte füge zuerst einen Artikel hinzu.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const response = await ordersService.checkout({
        items: items
          .filter(({ product }) => getId(product))
          .map(({ product, quantity }) => ({ productId: getId(product), quantity })),
        address,
        shippingMethod: shipping,
        mode: 'demo',
      })
      setResult({ order: response?.order ?? null, checkout: response?.checkout ?? null, total })
      clear()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(apiErrorMessage(err, 'Die Testbestellung konnte nicht erstellt werden.'))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const orderNumber = result.order?.orderNumber ?? result.order?.number ?? result.order?.id ?? result.order?._id
    const demoMode = result.checkout?.mode === 'demo'
    return (
      <div className="container-x py-16">
        <div className="mx-auto max-w-xl surface p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto size-14 text-brand-600" />
          <h1 className="mt-5 text-2xl font-extrabold">Testbestellung erstellt</h1>
          {orderNumber && <p className="mt-2 text-sm font-bold text-brand-800">Bestellnummer: {orderNumber}</p>}
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {demoMode
              ? 'Es wurde keine echte Zahlung ausgelöst, kein Geld abgebucht und kein Kartendaten-Eingabefeld verwendet. Die Bestellung wurde ausschließlich im Demo-Modus angelegt.'
              : 'Der Server hat einen anderen Zahlungsmodus gemeldet. Es wurden keine Zahlungsdaten erfasst.'}
          </p>
          {typeof result.checkout?.message === 'string' && result.checkout.message && (
            <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">{result.checkout.message}</p>
          )}
          <div className="mt-6 rounded-xl bg-sand-100 p-4 text-left text-sm text-brand-950">
            <p><strong>Lieferadresse:</strong> {result.order?.address?.firstName ?? address.firstName} {result.order?.address?.lastName ?? address.lastName}, {result.order?.address?.street ?? address.street} {result.order?.address?.houseNumber ?? address.houseNumber}, {result.order?.address?.postalCode ?? address.postalCode} {result.order?.address?.city ?? address.city}</p>
            <p className="mt-1"><strong>Übergabe:</strong> {shipping === 'versand' ? 'Versand' : 'Abholung'}</p>
            <p className="mt-1"><strong>Summe:</strong> {formatEUR(result.order?.total ?? result.total)}</p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/bestellungen" className="btn-primary">Zu meinen Bestellungen</Link>
            <Link to="/marktplatz" className="btn-outline">Weiter stöbern</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="container-x py-12">
        <EmptyState icon={ShoppingBag} title="Keine Artikel im Warenkorb" description="Lege zuerst Artikel in den Warenkorb, um den Test-Checkout auszuprobieren." to="/marktplatz" actionLabel="Zum Marktplatz" />
      </div>
    )
  }

  return (
    <div className="container-x py-10">
      <Link to="/warenkorb" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline"><ArrowLeft className="size-4" /> Zum Warenkorb</Link>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Checkout</h1>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sand-300 bg-sand-100 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-sand-700" />
        <div>
          <p className="text-sm font-extrabold text-brand-950">Test-Checkout – keine echte Zahlung</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Hier wird eine Demo-Bestellung über die API angelegt. Es werden keine Zahlungsdaten erhoben und kein Geld abgebucht. Kartendaten werden nicht abgefragt.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><MapPin className="size-5 text-brand-600" /> Lieferadresse</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="checkout-first-name">Vorname *</label>
                <input id="checkout-first-name" className="input" required value={address.firstName} onChange={(e) => update('firstName', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="checkout-last-name">Nachname *</label>
                <input id="checkout-last-name" className="input" required value={address.lastName} onChange={(e) => update('lastName', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="checkout-street">Straße *</label>
                <input id="checkout-street" className="input" required value={address.street} onChange={(e) => update('street', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="checkout-house-number">Hausnummer *</label>
                <input id="checkout-house-number" className="input" required value={address.houseNumber} onChange={(e) => update('houseNumber', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="checkout-zip">Postleitzahl *</label>
                <input id="checkout-zip" className="input" inputMode="numeric" maxLength={5} required value={address.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div>
                <label className="label" htmlFor="checkout-city">Ort *</label>
                <input id="checkout-city" className="input" required value={address.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="checkout-country">Land *</label>
                <input id="checkout-country" className="input" required value={address.country} onChange={(e) => update('country', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Truck className="size-5 text-brand-600" /> Übergabeart</h2>
            <div className="mt-5 space-y-3">
              {[
                { value: 'versand', title: 'Versand', text: 'Abstimmung der Versandkosten direkt mit der Verkäufer:in' },
                { value: 'abholung', title: 'Abholung', text: 'Persönliche Übergabe im vereinbarten Ort' },
              ].map((option) => (
                <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${shipping === option.value ? 'border-brand-600 bg-brand-50' : 'border-brand-900/10'}`}>
                  <input type="radio" name="shipping" className="mt-1 size-4 accent-brand-700" checked={shipping === option.value} onChange={() => setShipping(option.value)} />
                  <span>
                    <span className="block text-sm font-extrabold text-brand-950">{option.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{option.text}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            <LockKeyhole className="size-4" /> {busy ? 'Testbestellung wird erstellt …' : 'Testbestellung abschließen'}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">Deine Artikel</h2>
            <ul className="mt-4 space-y-3">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-600">{quantity}× {product.title}</span>
                  <span className="shrink-0 font-bold">{formatEUR(product.price * quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="divider mt-5" />
            <div className="mt-4 flex justify-between text-lg font-extrabold"><span>Summe</span><span className="text-brand-800">{formatEUR(total)}</span></div>
            <p className="mt-4 text-xs text-slate-500">Keine Zahlung erforderlich – dieser Checkout läuft im Demo-Modus.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
