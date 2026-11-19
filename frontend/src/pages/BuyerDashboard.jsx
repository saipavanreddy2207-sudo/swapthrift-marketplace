import { ArrowRight, Heart, Mail, Package, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import useApi from '../hooks/useApi'
import conversationsService from '../services/conversations'
import favoritesService from '../services/favorites'
import notificationsService from '../services/notifications'
import ordersService from '../services/orders'
import { apiErrorMessage } from '../utils/apiError'
import { normaliseOrder, orderStatusLabel } from '../utils/entities'
import { displayName, formatDate } from '../utils/format'

function countOrPlaceholder(state, extract) {
  if (state.loading) return '…'
  if (state.error) return '–'
  const value = extract(state.data)
  return Number.isFinite(value) ? value : '–'
}

export default function BuyerDashboard() {
  const { user } = useAuth()
  const { count: cartCount } = useCart()
  const name = displayName(user)

  const orders = useApi(() => ordersService.list('buyer'), [])
  const favorites = useApi(() => favoritesService.list(), [])
  const conversations = useApi(() => conversationsService.list(), [])
  const notifications = useApi(() => notificationsService.list(), [])

  const recentOrders = (Array.isArray(orders.data) ? orders.data : []).map(normaliseOrder).filter(Boolean).slice(0, 4)

  const shortcuts = [
    { to: '/bestellungen', icon: ShoppingBag, label: 'Bestellungen', count: countOrPlaceholder(orders, (data) => (Array.isArray(data) ? data.length : NaN)) },
    { to: '/favoriten', icon: Heart, label: 'Favoriten', count: countOrPlaceholder(favorites, (data) => data?.products?.length) },
    { to: '/nachrichten', icon: Mail, label: 'Nachrichten', count: countOrPlaceholder(conversations, (data) => (Array.isArray(data) ? data.length : NaN)) },
    { to: '/warenkorb', icon: Package, label: 'Warenkorb', count: cartCount },
  ]

  return (
    <div>
      <div className="surface overflow-hidden">
        <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-8 text-white">
          <span className="badge bg-white/10 text-sand-200"><Sparkles className="size-3.5" /> Käuferbereich</span>
          <h1 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">Hallo, {name}!</h1>
          <p className="mt-2 text-sm text-brand-100">Schön, dass du bei SwapThrift dabei bist. Hier behältst du den Überblick.</p>
          {!notifications.loading && !notifications.error && Number(notifications.data?.unreadCount) > 0 && (
            <p className="mt-3 text-sm font-semibold text-sand-200">
              {notifications.data.unreadCount} {notifications.data.unreadCount === 1 ? 'ungelesene Benachrichtigung' : 'ungelesene Benachrichtigungen'}
            </p>
          )}
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(({ to, icon: Icon, label, count }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-brand-900/8 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-brand-950">{label}</span>
                <span className="block text-xs text-slate-500">{typeof count === 'number' ? `${count} Einträge` : 'Keine Daten verfügbar'}</span>
              </span>
              <ArrowRight className="size-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Letzte Bestellungen</h2>
            <p className="mt-1 text-xs text-slate-500">Deine zuletzt getätigten Käufe.</p>
          </div>
          <Link to="/bestellungen" className="link-brand text-sm">Alle Bestellungen ansehen →</Link>
        </div>
        {orders.loading ? (
          <Loader label="Bestellungen werden geladen …" />
        ) : orders.error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {apiErrorMessage(orders.error)}
            <button type="button" onClick={orders.refetch} className="btn-outline ml-3 px-3 py-1.5 text-xs">Erneut versuchen</button>
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="mt-5 rounded-xl bg-sand-100 p-5 text-sm text-slate-600">
            Du hast noch keine Bestellungen. Entdecke Angebote auf dem Marktplatz.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-brand-900/8">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-brand-950">{order.product?.title || 'Artikel nicht mehr verfügbar'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.createdAt ? formatDate(order.createdAt) : 'Datum nicht angegeben'}
                  </p>
                </div>
                <span className="badge bg-brand-50 text-brand-800">{orderStatusLabel(order.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/marktplatz" className="btn-primary">Angebote entdecken</Link>
        <Link to="/verkaeufer" className="btn-outline">Zum Verkäuferbereich</Link>
      </div>
    </div>
  )
}
