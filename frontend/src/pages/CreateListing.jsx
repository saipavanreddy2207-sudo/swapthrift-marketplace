import {
  ArrowRight,
  Check,
  ImagePlus,
  Leaf,
  PackagePlus,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useApi from '../hooks/useApi'
import categoriesService from '../services/categories'
import productsService from '../services/products'

const conditions = [
  { value: 'Neu', label: 'Neu – unbenutzt & in Originalverpackung' },
  { value: 'Wie neu', label: 'Wie neu – kaum benutzt' },
  { value: 'Sehr gut', label: 'Sehr gut – kleine Gebrauchsspuren' },
  { value: 'Gut', label: 'Gut – normal gebraucht' },
  { value: 'Akzeptabel', label: 'Akzeptabel – deutlich getragen/genutzt' },
]

const initialForm = {
  title: '',
  description: '',
  price: '',
  category: '',
  subcategory: '',
  brand: '',
  condition: '',
  city: '',
  postalCode: '',
  shippingAvailable: true,
  pickupAvailable: true,
  shippingCost: '',
  availability: 'available',
}

export default function CreateListing() {
  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const { data: categories } = useApi(() => categoriesService.list(), [])
  const [form, setForm] = useState(() => ({
    ...initialForm,
    city: user?.city || '',
    postalCode: user?.postalCode || '',
  }))
  const [images, setImages] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview))
    }
  }, [images])

  const selectedCategory = (categories ?? []).find(
    (category) => String(category.id ?? category.slug) === form.category,
  )
  const subcategories = selectedCategory?.subcategories ?? []

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleImages(event) {
    const files = Array.from(event.target.files || [])
    const remaining = Math.max(0, 5 - images.length)
    const additions = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      key: `${file.name}-${file.lastModified}-${Math.random()}`,
    }))
    setImages((current) => [...current, ...additions])
    event.target.value = ''
  }

  function removeImage(key) {
    setImages((current) => {
      const target = current.find((image) => image.key === key)
      if (target) URL.revokeObjectURL(target.preview)
      return current.filter((image) => image.key !== key)
    })
  }

  function makeMain(key) {
    setImages((current) => {
      const target = current.find((image) => image.key === key)
      if (!target) return current
      return [target, ...current.filter((image) => image.key !== key)]
    })
  }

  function validate() {
    if (form.title.trim().length < 5) return 'Der Titel muss mindestens 5 Zeichen lang sein.'
    if (form.description.trim().length < 20) return 'Bitte beschreibe deinen Artikel mit mindestens 20 Zeichen.'
    if (!(Number(form.price) > 0)) return 'Bitte gib einen gültigen Preis größer als 0 € ein.'
    if (!form.category) return 'Bitte wähle eine Kategorie.'
    if (!form.condition) return 'Bitte wähle den Zustand des Artikels.'
    if (!form.city.trim()) return 'Bitte gib den Ort an.'
    if (!/^\d{5}$/.test(form.postalCode.trim())) return 'Bitte gib eine gültige fünfstellige Postleitzahl ein.'
    if (!form.shippingAvailable && !form.pickupAvailable) return 'Bitte wähle mindestens eine Übergabeoption.'
    if (!images.length) return 'Bitte lade mindestens ein Foto hoch.'
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError('')
    setBusy(true)
    try {
      const data = new FormData()
      data.append('title', form.title.trim())
      data.append('description', form.description.trim())
      data.append('price', String(Number(form.price)))
      data.append('category', form.category)
      if (form.subcategory) data.append('subcategory', form.subcategory)
      if (form.brand.trim()) data.append('brand', form.brand.trim())
      data.append('condition', form.condition)
      data.append('city', form.city.trim())
      data.append('postalCode', form.postalCode.trim())
      const shippingOptions = []
      if (form.shippingAvailable) {
        shippingOptions.push({ type: 'Versand', cost: Number(form.shippingCost) || 0 })
      }
      if (form.pickupAvailable) {
        shippingOptions.push({ type: 'Abholung', cost: 0 })
      }
      data.append('shippingOptions', JSON.stringify(shippingOptions))
      data.append('availability', form.availability)
      images.forEach((image) => data.append('images', image.file))

      const created = await productsService.create(data)
      const createdId = created?.id ?? created?._id ?? created?.product?.id ?? created?.data?.id
      success('Dein Inserat wurde erstellt!')
      navigate(createdId ? `/produkt/${createdId}` : '/marktplatz', { replace: true })
    } catch (err) {
      toastError(err.message)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Verkaufen</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Neues Inserat erstellen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gute Fotos und eine ehrliche Beschreibung helfen deinem Schatz, schnell ein neues Zuhause zu finden.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Leaf, title: 'Kostenlos inserieren', text: 'Keine Gebühren für private Angebote' },
            { icon: ShieldCheck, title: 'Sicher verkaufen', text: 'Du entscheidest über Versand & Abholung' },
            { icon: Truck, title: 'Ganz Deutschland', text: 'Käufer:innen aus allen Regionen erreichen' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex items-start gap-3 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-extrabold">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><PackagePlus className="size-5 text-brand-600" /> 1. Fotos</h2>
            <p className="mt-1 text-xs text-slate-500">Bis zu 8 Bilder. Das erste Bild ist das Hauptbild – du kannst die Reihenfolge ändern.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <div key={image.key} className={`group relative overflow-hidden rounded-xl border-2 ${index === 0 ? 'border-brand-700' : 'border-transparent'}`}>
                  <img src={image.preview} alt={`Vorschau ${index + 1}`} className="aspect-square w-full object-cover" />
                  {index === 0 && <span className="absolute top-2 left-2 badge bg-brand-800 text-white">Hauptbild</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-brand-950/80 to-transparent p-2">
                    {index > 0 && (
                      <button type="button" onClick={() => makeMain(image.key)} className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-brand-900 hover:bg-white">Hauptbild</button>
                    )}
                    <button type="button" onClick={() => removeImage(image.key)} aria-label="Foto entfernen" className="ml-auto grid size-7 place-items-center rounded-lg bg-white/90 text-red-600 hover:bg-white">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              {images.length < 8 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-center transition-colors hover:border-brand-500 hover:bg-brand-50">
                  <span>
                    <ImagePlus className="mx-auto size-7 text-brand-600" />
                    <span className="mt-2 block text-xs font-bold text-brand-800">Fotos hinzufügen</span>
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="sr-only" />
                </label>
              )}
            </div>
          </section>

          <section className="card space-y-5 p-6">
            <h2 className="text-lg font-extrabold">2. Angaben zum Artikel</h2>
            <div>
              <label className="label" htmlFor="listing-title">Titel *</label>
              <input id="listing-title" className="input" required maxLength={120} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="z. B. Vintage Stehleuchte aus den 70ern" />
            </div>
            <div>
              <label className="label" htmlFor="listing-description">Beschreibung *</label>
              <textarea id="listing-description" rows={6} className="input resize-none" required value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Beschreibe Zustand, Maße, Besonderheiten und warum du den Artikel weitergehst …" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="listing-price">Preis in EUR *</label>
                <input id="listing-price" type="number" min="0" step="0.01" className="input" required value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label className="label" htmlFor="listing-category">Kategorie *</label>
                <select id="listing-category" className="input" required value={form.category} onChange={(e) => { update('category', e.target.value); update('subcategory', '') }}>
                  <option value="">Bitte wählen</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id ?? category.slug} value={category.id ?? category.slug}>{category.name}</option>
                  ))}
                </select>
                {!categories?.length && <p className="mt-1 text-xs text-slate-500">Kategorien sind derzeit nicht verfügbar.</p>}
              </div>
              <div>
                <label className="label" htmlFor="listing-subcategory">Unterkategorie</label>
                {subcategories.length ? (
                  <select id="listing-subcategory" className="input" value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)}>
                    <option value="">Keine Angabe</option>
                    {subcategories.map((sub) => (
                      <option key={typeof sub === 'string' ? sub : sub.id ?? sub.name} value={typeof sub === 'string' ? sub : sub.slug ?? sub.name}>
                        {typeof sub === 'string' ? sub : sub.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="listing-subcategory" className="input" value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} placeholder="z. B. Wohnzimmer" />
                )}
              </div>
              <div>
                <label className="label" htmlFor="listing-brand">Marke</label>
                <input id="listing-brand" className="input" value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="z. B. IKEA" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="listing-condition">Zustand *</label>
                <select id="listing-condition" className="input" required value={form.condition} onChange={(e) => update('condition', e.target.value)}>
                  <option value="">Bitte wählen</option>
                  {conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="card space-y-5 p-6">
            <h2 className="text-lg font-extrabold">3. Standort & Übergabe</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="listing-city">Ort *</label>
                <input id="listing-city" className="input" required value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="z. B. Berlin" />
              </div>
              <div>
                <label className="label" htmlFor="listing-zip">Postleitzahl *</label>
                <input id="listing-zip" className="input" inputMode="numeric" maxLength={5} required value={form.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} placeholder="10115" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand-50 p-4 text-sm font-semibold">
                <input type="checkbox" className="size-4 accent-brand-700" checked={form.shippingAvailable} onChange={(e) => update('shippingAvailable', e.target.checked)} />
                <Truck className="size-4 text-brand-700" /> Versand ist möglich
              </label>
              {form.shippingAvailable && (
                <div className="pl-4">
                  <label className="label" htmlFor="listing-shipping-cost">Versandkosten in EUR</label>
                  <input id="listing-shipping-cost" type="number" min="0" step="0.01" className="input max-w-52" value={form.shippingCost} onChange={(e) => update('shippingCost', e.target.value)} placeholder="0,00" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand-50 p-4 text-sm font-semibold">
                <input type="checkbox" className="size-4 accent-brand-700" checked={form.pickupAvailable} onChange={(e) => update('pickupAvailable', e.target.checked)} />
                <Check className="size-4 text-brand-700" /> Abholung ist möglich
              </label>
            </div>
            <div>
              <label className="label" htmlFor="listing-availability">Verfügbarkeit</label>
              <select id="listing-availability" className="input max-w-xs" value={form.availability} onChange={(e) => update('availability', e.target.value)}>
                <option value="available">Sofort verfügbar</option>
                <option value="reserved">Derzeit reserviert</option>
                <option value="sold">Bereits verkauft</option>
              </select>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/marktplatz" className="btn-ghost"><X className="size-4" /> Abbrechen</Link>
            <button type="submit" disabled={busy} className="btn-primary px-6 py-3">
              {busy ? 'Inserat wird veröffentlicht …' : 'Inserat veröffentlichen'} {!busy && <ArrowRight className="size-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
