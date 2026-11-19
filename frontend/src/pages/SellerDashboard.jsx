import { ArrowRight, Eye, MessageCircle, Package, PlusCircle, ShoppingBag, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Loader } from '../components/Loader'
import Rating from '../components/Rating'
import { useAuth } from '../context/AuthContext'
import useApi from '../hooks/useApi'
import ordersService from '../services/orders'
import productsService, { normaliseProduct } from '../services/products'
import { apiErrorMessage } from '../utils/apiError'
import { getId, normaliseOrder, personLabel } from '../utils/entities'
import { displayName, formatEUR, getImageUrl } from '../utils/format'

function statValue(value, loading, error) {
  if (loading) return '…'
  if (error) return '–'
  return Number.isFinite(Number(value)) ? Number(value) : '–'
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const userId = getId(user)

  const products = useApi(() => productsService.list({ limit: 50 }), [])
  const orders = useApi(() => ordersService.list('seller'), [])
  const reviews = useApi(() => ordersService.reviews({ seller: userId }), [userId])

  const allProducts = (products.data?.items ?? []).map(normaliseProduct).filter(Boolean)
  const ownProducts = allProducts.filter((product) => {
    const sellerId = getId(product.seller ?? product.sellerId)
    return sellerId && sellerId === userId
  })
  const activeCount = ownProducts.filter((product) => {
    const status = String(product.status ?? '').toLowerCase()
    return status ? ['active', 'available', 'published', 'freigegeben'].includes(status) : product.isActive !== false
  }).length
  const sellerOrders = (Array.isArray(orders.data) ? orders.data : []).map(normaliseOrder).filter(Boolean)
  const summary = reviews.data?.summary ?? { average: 0, count: 0 }
  const reviewList = (reviews.data?.reviews ?? []).slice(0, 3)

  const stats = [
    { label: 'Eigene Inserate', value: statValue(ownProducts.length, products.loading, products.error), icon: Store },
    { label: 'Aktive Inserate', value: statValue(activeCount, products.loading, products.error), icon: Eye },
    { label: 'Verkäufe', value: statValue(sellerOrders.length, orders.loading, orders.error), icon: ShoppingBag },
    { label: 'Bewertungen', value: statValue(summary.count, reviews.loading, reviews.error), icon: Star },
  ]

  return (
    <div>
      <div className="surface overflow-hidden">
        <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-8 text-white">
          <span className="badge bg-white/10 text-sand-200"><Store className="size-3.5" /> Verkäuferbereich</span>
          <h1 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">Hallo, {displayName(user)}!</h1>
          <p className="mt-2 text-sm text-brand-100">Verwalte deine Inserate, Verkäufe und Bewertungen an einem Ort.</p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-brand-900/8 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" /></span>
              <p className="mt-3 text-2xl font-extrabold text-brand-950">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Meine Inserate</h2>
            <p className="mt-1 text-xs text-slate-500">Es werden die ersten 50 Inserate des Marktplatzes nach deiner Verkäufer-ID gefiltert.</p>
          </div>
          <Link to="/verkaufen" className="btn-primary px-3 py-2 text-xs"><PlusCircle className="size-4" /> Neues Inserat</Link>
        </div>

        {products.loading ? (
          <Loader label="Inserate werden geladen …" />
        ) : products.error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {apiErrorMessage(products.error)}
            <button type="button" onClick={products.refetch} className="btn-outline ml-3 px-3 py-1.5 text-xs">Erneut versuchen</button>
          </div>
        ) : ownProducts.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={Package}
              title="Noch keine eigenen Inserate"
              description="In den geladenen Angeboten wurde kein Inserat mit deiner Verkäufer-ID gefunden."
              to="/verkaufen"
              actionLabel="Inserat erstellen"
            />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-brand-900/8">
            {ownProducts.map((product) => {
              const image = getImageUrl(product.images?.[0])
              const status = product.status ?? (product.isActive === false ? 'inaktiv' : 'aktiv')
              return (
                <li key={product.id} className="flex flex-wrap items-center gap-4 py-3">
                  <Link to={`/produkt/${encodeURIComponent(product.id)}`} className="size-14 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                    {image ? <img src={image} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-brand-700"><Package className="size-5" /></span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/produkt/${encodeURIComponent(product.id)}`} className="block truncate text-sm font-extrabold text-brand-950 hover:text-brand-700">{product.title}</Link>
                    <p className="mt-1 text-xs text-slate-500">{product.price ? formatEUR(product.price) : 'Preis nicht angegeben'}</p>
                  </div>
                  <span className="badge bg-sand-100 text-sand-800">{String(status).replace(/_/g, ' ')}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-extrabold">Bewertungen</h2>
          {reviews.loading ? (
            <Loader label="Bewertungen werden geladen …" />
          ) : reviews.error ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{apiErrorMessage(reviews.error)}</p>
          ) : summary.count > 0 ? (
            <>
              <div className="mt-3"><Rating value={summary.average} count={summary.count} size="lg" /></div>
              <ul className="mt-5 space-y-4">
                {reviewList.map((review, index) => (
                  <li key={getId(review) || index} className="border-t border-brand-900/8 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-brand-950">{personLabel(review.buyer ?? review.user ?? review.author)}</p>
                      <Rating value={review.rating} showValue={false} />
                    </div>
                    {review.text && <p className="mt-1 text-sm text-slate-600">{review.text}</p>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 rounded-xl bg-sand-100 p-4 text-sm text-slate-600">Noch keine Bewertungen vorhanden.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-extrabold">Schnellzugriff</h2>
          <div className="mt-4 grid gap-3">
            {[
              { to: '/verkaufen', icon: PlusCircle, label: 'Neues Inserat erstellen' },
              { to: '/bestellungen', icon: ShoppingBag, label: 'Verkäufe und Bestellungen' },
              { to: '/nachrichten', icon: MessageCircle, label: 'Nachrichten beantworten' },
              { to: '/verkaeufer/profil', icon: Store, label: 'Verkäuferprofil ansehen' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-brand-900/8 p-3 text-sm font-bold text-brand-950 hover:border-brand-300 hover:bg-brand-50">
                <Icon className="size-5 text-brand-700" /> {label} <ArrowRight className="ml-auto size-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
