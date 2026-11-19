import { ArrowRight, ImageOff, Minus, Plus, ShoppingCart, Trash2, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useCart } from '../context/CartContext'
import { getImageUrl, formatEUR } from '../utils/format'

export default function Cart() {
  const { items, count, total, updateQuantity, remove, clear } = useCart()

  if (!items.length) {
    return (
      <div className="container-x py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Dein Warenkorb ist leer"
          description="Entdecke den Marktplatz und lege deine Lieblingsstücke in den Warenkorb."
          to="/marktplatz"
          actionLabel="Jetzt entdecken"
        />
      </div>
    )
  }

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Deine Auswahl</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Warenkorb</h1>
          <p className="mt-2 text-sm text-slate-600">{count} Artikel</p>
        </div>
        <button type="button" onClick={clear} className="btn-ghost"><Trash2 className="size-4" /> Warenkorb leeren</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => {
            const image = getImageUrl(product.images?.[0])
            return (
              <div key={product.id} className="card flex gap-4 p-3 sm:p-4">
                <Link to={`/produkt/${product.id}`} className="size-20 shrink-0 overflow-hidden rounded-xl bg-sand-100 sm:size-24">
                  {image ? <img src={image} alt={product.title} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-brand-700"><ImageOff className="size-8 opacity-50" /></div>}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/produkt/${product.id}`} className="line-clamp-2 text-sm font-extrabold text-brand-950 hover:text-brand-700">{product.title}</Link>
                  <p className="mt-1 text-xs text-slate-500">{product.city || 'Deutschland'}</p>
                  <p className="mt-2 font-extrabold text-brand-800">{formatEUR(product.price)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-lg border border-brand-900/10">
                      <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} disabled={quantity <= 1} aria-label="Menge verringern" className="grid size-8 place-items-center text-brand-800 hover:bg-brand-50 disabled:opacity-40"><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                      <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} aria-label="Menge erhöhen" className="grid size-8 place-items-center text-brand-800 hover:bg-brand-50"><Plus className="size-3.5" /></button>
                    </div>
                    <button type="button" onClick={() => remove(product.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600">
                      <Trash2 className="size-3.5" /> Entfernen
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-right font-extrabold text-brand-950">{formatEUR(product.price * quantity)}</p>
              </div>
            )
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">Zusammenfassung</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Zwischensumme</dt><dd className="font-bold">{formatEUR(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Versand</dt><dd className="font-bold text-slate-500">Im nächsten Schritt</dd></div>
              <div className="divider" />
              <div className="flex justify-between text-lg"><dt className="font-extrabold">Gesamt</dt><dd className="font-extrabold text-brand-800">{formatEUR(total)}</dd></div>
            </dl>
            <Link to="/checkout" className="btn-primary mt-6 w-full py-3">Zum Test-Checkout <ArrowRight className="size-4" /></Link>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <Truck className="mt-0.5 size-4 shrink-0 text-brand-600" />
              Versandkosten und Übergabe werden direkt mit den Verkäufer:innen abgestimmt.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
