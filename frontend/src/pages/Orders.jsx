import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Package,
  ShoppingBag,
  Star,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { useToast } from '../context/ToastContext'
import useApi from '../hooks/useApi'
import ordersService from '../services/orders'
import { apiErrorMessage } from '../utils/apiError'
import { getId, normaliseOrder, orderStatusLabel, personLabel } from '../utils/entities'
import { formatDate, formatEUR, getImageUrl } from '../utils/format'

function StatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase()
  const tone = ['delivered', 'completed'].includes(key)
    ? 'bg-brand-50 text-brand-800'
    : ['cancelled', 'canceled', 'refunded'].includes(key)
      ? 'bg-red-50 text-red-700'
      : ['shipped', 'in_transit', 'paid'].includes(key)
        ? 'bg-blue-50 text-blue-700'
        : 'bg-amber-50 text-amber-800'
  return <span className={`badge ${tone}`}>{orderStatusLabel(status)}</span>
}

function OrderTimeline({ order }) {
  const raw = order.timeline ?? order.history ?? order.statusHistory
  const events = Array.isArray(raw)
    ? raw.map((entry, index) => ({
        id: getId(entry) || `event-${index}`,
        label: orderStatusLabel(entry.status ?? entry.label ?? entry.type),
        date: entry.createdAt ?? entry.date ?? entry.at ?? null,
        note: entry.note ?? entry.description ?? '',
      }))
    : [
        { id: 'created', label: 'Bestellung aufgegeben', date: order.createdAt },
        { id: 'paid', label: 'Bezahlt', date: order.paidAt ?? order.payment?.paidAt },
        { id: 'shipped', label: 'Versendet', date: order.shippedAt ?? order.shipping?.shippedAt },
        { id: 'delivered', label: 'Geliefert', date: order.deliveredAt },
        { id: 'cancelled', label: 'Storniert', date: order.cancelledAt },
      ].filter((event) => event.date)

  return (
    <div>
      <h3 className="text-sm font-extrabold text-brand-950">Statusverlauf</h3>
      {events.length ? (
        <ol className="mt-4 space-y-4 border-l-2 border-brand-100 pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-white bg-brand-600 shadow" />
              <p className="text-sm font-bold text-brand-950">{event.label}</p>
              {event.date && <p className="text-xs text-slate-500">{formatDate(event.date, { hour: '2-digit', minute: '2-digit' })}</p>}
              {event.note && <p className="mt-1 text-xs text-slate-600">{event.note}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Für diese Bestellung sind noch keine weiteren Statusereignisse erfasst.</p>
      )}
      {order.trackingNumber && (
        <p className="mt-5 rounded-xl bg-sand-100 p-3 text-xs text-brand-950">
          Sendungsnummer: <strong>{order.trackingNumber}</strong>
          {order.carrier ? ` · Versanddienstleister: ${order.carrier}` : ''}
        </p>
      )}
    </div>
  )
}

function ReviewForm({ order, onSubmitted }) {
  const { success, error: toastError } = useToast()
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const alreadyReviewed = Boolean(order.review ?? order.reviewed)

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy || alreadyReviewed) return
    setBusy(true)
    try {
      await ordersService.createReview({ orderId: getId(order), rating, text: text.trim() })
      success('Danke! Deine Bewertung wurde veröffentlicht.')
      setText('')
      onSubmitted?.()
    } catch (error) {
      toastError(apiErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (alreadyReviewed) {
    return <p className="rounded-xl bg-brand-50 p-3 text-sm font-semibold text-brand-800">Du hast diese Bestellung bereits bewertet.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-900/8 p-4">
      <h3 className="text-sm font-extrabold">Bestellung bewerten</h3>
      <div className="mt-3 flex items-center gap-1" role="group" aria-label="Sternebewertung">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} ${value === 1 ? 'Stern' : 'Sterne'}`}
            className="rounded p-0.5 text-amber-400 hover:scale-110"
          >
            <Star className={`size-6 ${value <= rating ? 'fill-current' : 'text-slate-300'}`} />
          </button>
        ))}
        <span className="ml-2 text-sm font-bold text-brand-950">{rating}/5</span>
      </div>
      <label className="label mt-3" htmlFor={`review-text-${getId(order)}`}>Deine Erfahrung (optional)</label>
      <textarea
        id={`review-text-${getId(order)}`}
        className="input resize-none"
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Wie war die Übergabe?"
      />
      <button type="submit" disabled={busy} className="btn-primary mt-3 px-3 py-2 text-xs">
        {busy ? 'Wird gesendet …' : 'Bewertung senden'}
      </button>
    </form>
  )
}

export default function Orders() {
  const [role, setRole] = useState('buyer')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [tracking, setTracking] = useState({})
  const { success, error: toastError } = useToast()

  const { data, loading, error, refetch } = useApi(() => ordersService.list(role), [role])
  const orders = (Array.isArray(data) ? data : []).map(normaliseOrder).filter(Boolean)
  const selected = orders.find((order) => order.id === selectedId) ?? null

  /* oxlint-disable react/set-state-in-effect -- Detailansicht wird beim Schließen des Dialogs zurückgesetzt. */
  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return undefined
    }
    let active = true
    setDetailLoading(true)
    setDetailError('')
    ordersService
      .get(selectedId)
      .then((payload) => {
        if (active) setDetail(normaliseOrder(payload?.order ?? payload))
      })
      .catch((error) => {
        if (active) setDetailError(apiErrorMessage(error))
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedId])
  /* oxlint-enable react/set-state-in-effect */

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') setSelectedId('')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function trackingFor(id) {
    return tracking[id] ?? { carrier: '', trackingNumber: '' }
  }

  function updateTracking(id, field, value) {
    setTracking((current) => ({
      ...current,
      [id]: { ...trackingFor(id), [field]: value },
    }))
  }

  async function runAction(id, action, message) {
    if (busyId) return
    setBusyId(id)
    try {
      await action()
      success(message)
      setSelectedId('')
      refetch()
    } catch (error) {
      toastError(apiErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  function refreshDetail() {
    refetch()
    if (!selectedId) return
    ordersService
      .get(selectedId)
      .then((payload) => setDetail(normaliseOrder(payload?.order ?? payload)))
      .catch(() => {})
  }

  function handleCancel(id) {
    runAction(id, () => ordersService.cancel(id), 'Die Bestellung wurde storniert.')
  }

  function handleShipped(id) {
    const input = trackingFor(id)
    runAction(
      id,
      () =>
        ordersService.updateStatus(id, {
          status: 'shipped',
          ...(input.carrier.trim() ? { carrier: input.carrier.trim() } : {}),
          ...(input.trackingNumber.trim() ? { trackingNumber: input.trackingNumber.trim() } : {}),
        }),
      'Die Bestellung wurde als versendet markiert.',
    )
  }

  const detailOrder = detail ?? selected

  return (
    <div className="container-x py-10">
      <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Bestellungen</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Meine Bestellungen</h1>
      <p className="mt-2 text-sm text-slate-600">Verfolge deine Käufe und Verkäufe und halte den Status aktuell.</p>

      <div className="mt-8 inline-flex rounded-xl border border-brand-900/10 bg-white p-1" role="tablist" aria-label="Bestellungen filtern">
        {[
          { value: 'buyer', label: 'Als Käufer' },
          { value: 'seller', label: 'Als Verkäufer' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={role === tab.value}
            onClick={() => { setRole(tab.value); setSelectedId('') }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${role === tab.value ? 'bg-brand-800 text-white' : 'text-slate-600 hover:bg-brand-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Bestellungen werden geladen …" />
        ) : error ? (
          <div role="alert" className="card p-6">
            <p className="font-bold text-red-700">{apiErrorMessage(error)}</p>
            <button type="button" onClick={refetch} className="btn-outline mt-4">Erneut versuchen</button>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={role === 'buyer' ? 'Noch keine Bestellungen' : 'Noch keine Verkäufe'}
            description={role === 'buyer' ? 'Deine Käufe erscheinen hier, sobald du eine Bestellung abgeschlossen hast.' : 'Sobald jemand eines deiner Angebote kauft, findest du die Bestellung hier.'}
            to="/marktplatz"
            actionLabel="Angebote entdecken"
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const image = getImageUrl(order.product?.images?.[0])
              const other = role === 'buyer' ? order.seller : order.buyer
              const key = String(order.status ?? '').toLowerCase()
              const canCancel = role === 'buyer' && !['delivered', 'completed', 'cancelled', 'canceled', 'refunded'].includes(key)
              return (
                <li key={order.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link to={order.product?.id ? `/produkt/${encodeURIComponent(order.product.id)}` : '/marktplatz'} className="size-20 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                      {image ? <img src={image} alt={order.product?.title || 'Artikel'} className="size-full object-cover" /> : <span className="grid size-full place-items-center text-brand-700"><Package className="size-8 opacity-50" /></span>}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} />
                        {order.orderNumber && <span className="text-xs font-semibold text-slate-500">Bestellung {order.orderNumber}</span>}
                      </div>
                      <p className="mt-2 truncate font-extrabold text-brand-950">{order.product?.title || 'Artikel nicht mehr verfügbar'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {role === 'buyer' ? 'Verkäufer:in' : 'Käufer:in'}: {personLabel(other)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="size-3.5" />
                        {order.createdAt ? formatDate(order.createdAt) : 'Datum nicht angegeben'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <p className="text-lg font-extrabold text-brand-800">{order.total === null ? '–' : formatEUR(order.total)}</p>
                      <button type="button" onClick={() => setSelectedId(order.id)} className="btn-outline px-3 py-1.5 text-xs">
                        Details ansehen
                      </button>
                    </div>
                  </div>

                  {role === 'seller' && !['delivered', 'completed', 'cancelled', 'canceled'].includes(key) && (
                    <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-brand-900/8 pt-4">
                      {key !== 'shipped' && key !== 'in_transit' && (
                        <>
                          <div>
                            <label className="label text-xs" htmlFor={`carrier-${order.id}`}>Versanddienstleister</label>
                            <input id={`carrier-${order.id}`} className="input py-2 text-xs" placeholder="z. B. DHL" value={trackingFor(order.id).carrier} onChange={(event) => updateTracking(order.id, 'carrier', event.target.value)} />
                          </div>
                          <div>
                            <label className="label text-xs" htmlFor={`tracking-${order.id}`}>Sendungsnummer</label>
                            <input id={`tracking-${order.id}`} className="input py-2 text-xs" placeholder="Optional" value={trackingFor(order.id).trackingNumber} onChange={(event) => updateTracking(order.id, 'trackingNumber', event.target.value)} />
                          </div>
                          <button type="button" disabled={Boolean(busyId)} onClick={() => handleShipped(order.id)} className="btn-primary px-3 py-2 text-xs">
                            <Truck className="size-4" /> Als versendet markieren
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => runAction(order.id, () => ordersService.updateStatus(order.id, { status: 'delivered' }), 'Die Bestellung wurde als geliefert markiert.')}
                        className="btn-outline px-3 py-2 text-xs"
                      >
                        <CheckCircle2 className="size-4" /> Als geliefert markieren
                      </button>
                    </div>
                  )}

                  {canCancel && (
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-brand-900/8 pt-4">
                      <button type="button" disabled={Boolean(busyId)} onClick={() => handleCancel(order.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline">
                        <XCircle className="size-4" /> Bestellung stornieren
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-brand-950/60 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Bestelldetails">
          <div className="w-full max-w-2xl animate-pop-in rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Bestelldetails</h2>
                <p className="mt-1 text-xs text-slate-500">{selected.orderNumber ? `Bestellung ${selected.orderNumber}` : `ID ${selected.id}`}</p>
              </div>
              <button type="button" onClick={() => setSelectedId('')} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-sand-100" aria-label="Schließen"><X className="size-5" /></button>
            </div>

            {detailError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</div>}
            {detailLoading ? (
              <Loader label="Details werden geladen …" />
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-3 rounded-xl border border-brand-900/8 p-4 text-sm sm:grid-cols-2">
                  <p><span className="text-slate-500">Artikel:</span> <strong>{detailOrder.product?.title || 'Nicht angegeben'}</strong></p>
                  <p><span className="text-slate-500">Status:</span> <StatusBadge status={detailOrder.status} /></p>
                  <p><span className="text-slate-500">Gesamt:</span> <strong>{detailOrder.total === null ? '–' : formatEUR(detailOrder.total)}</strong></p>
                  <p><span className="text-slate-500">{role === 'buyer' ? 'Verkäufer:in' : 'Käufer:in'}:</span> <strong>{personLabel(role === 'buyer' ? detailOrder.seller : detailOrder.buyer)}</strong></p>
                  {detailOrder.shippingMethod && <p><span className="text-slate-500">Übergabe:</span> <strong>{detailOrder.shippingMethod === 'abholung' ? 'Abholung' : 'Versand'}</strong></p>}
                  {detailOrder.address && (
                    <p className="sm:col-span-2">
                      <span className="text-slate-500">Lieferadresse:</span>{' '}
                      <strong>
                        {[detailOrder.address.firstName, detailOrder.address.lastName].filter(Boolean).join(' ')},{' '}
                        {detailOrder.address.street} {detailOrder.address.houseNumber},{' '}
                        {detailOrder.address.postalCode} {detailOrder.address.city}
                      </strong>
                    </p>
                  )}
                </div>

                <OrderTimeline order={detailOrder} />

                {detailOrder.items?.length > 1 && (
                  <div>
                    <h3 className="text-sm font-extrabold">Artikel</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {detailOrder.items.map((entry, index) => (
                        <li key={entry.id || index} className="flex justify-between gap-3 border-b border-brand-900/8 pb-2">
                          <span className="truncate text-slate-600">{entry.quantity}× {entry.product?.title || 'Artikel'}</span>
                          <span className="shrink-0 font-bold">{entry.product?.price ? formatEUR(entry.product.price * entry.quantity) : '–'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 border-t border-brand-900/8 pt-5">
                  <Link to="/nachrichten" className="btn-outline px-3 py-2 text-xs"><MessageCircle className="size-4" /> Nachricht senden</Link>
                  {role === 'buyer' && ['delivered', 'completed'].includes(String(detailOrder.status).toLowerCase()) && (
                    <div className="w-full">
                      <ReviewForm order={detailOrder} onSubmitted={refreshDetail} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
