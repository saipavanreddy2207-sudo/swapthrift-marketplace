import {
  ArrowLeft,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Loader } from '../components/Loader'
import ProductCard from '../components/ProductCard'
import Rating from '../components/Rating'
import SectionHeader from '../components/SectionHeader'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import useApi from '../hooks/useApi'
import ordersService from '../services/orders'
import productsService, { normaliseProduct } from '../services/products'
import { getId, personLabel } from '../utils/entities'
import { conditionLabel, displayName, formatDate, formatEUR, getImageUrl } from '../utils/format'

const reportReasons = [
  { value: 'misleading_description', label: 'Irreführende Beschreibung' },
  { value: 'fake_product', label: 'Gefälschter Artikel' },
  { value: 'inappropriate_content', label: 'Verbotener Artikel' },
  { value: 'scam', label: 'Betrugsverdacht' },
  { value: 'other', label: 'Sonstiger Grund' },
]

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add: addToCart } = useCart()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { success, error: toastError } = useToast()
  const [imageSelection, setImageSelection] = useState({ id: null, index: 0 })
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(reportReasons[0].value)
  const [reportNote, setReportNote] = useState('')
  const [reportBusy, setReportBusy] = useState(false)

  const { data, loading, error, refetch } = useApi(() => productsService.get(id), [id])
  const product = normaliseProduct(data)
  const images = product?.images ?? []
  const categoryId = product?.category?.id ?? product?.category?._id ?? product?.category?.slug ?? product?.category

  const { data: similarData } = useApi(
    () => productsService.related({ category: categoryId, limit: 4, exclude: id }),
    [id, String(categoryId)],
  )
  const { data: sellerData } = useApi(
    () => productsService.related({ seller: product?.seller?.id ?? product?.seller?._id, limit: 4, exclude: id }),
    [id, String(product?.seller?.id ?? product?.seller?._id ?? '')],
  )
  const { data: reviewsData, loading: reviewsLoading, error: reviewsError } = useApi(
    () => ordersService.reviews({ product: id }),
    [id],
  )

  const mainImage = imageSelection.id === id ? imageSelection.index : 0

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        success('Link in die Zwischenablage kopiert.')
      }
    } catch {
      // Cancelling the native share sheet needs no feedback.
    }
  }

  async function handleReport(event) {
    event.preventDefault()
    setReportBusy(true)
    try {
      await productsService.report(id, { reason: reportReason, details: reportNote })
      setReportOpen(false)
      setReportNote('')
      success('Danke. Deine Meldung wurde übermittelt.')
    } catch (err) {
      toastError(err.message)
    } finally {
      setReportBusy(false)
    }
  }

  if (loading) return <div className="container-x py-12"><Loader fullPage label="Angebot wird geladen …" /></div>

  if (error || !product?.id) {
    const notFound = error?.status === 404
    return (
      <div className="container-x py-16">
        <EmptyState
          icon={Package}
          title={notFound ? 'Dieses Angebot gibt es nicht mehr' : 'Angebot konnte nicht geladen werden'}
          description={notFound ? 'Vielleicht wurde es inzwischen verkauft oder entfernt. Entdecke ähnliche Angebote auf dem Marktplatz.' : error?.message}
          {...(notFound
            ? { to: '/marktplatz', actionLabel: 'Zum Marktplatz' }
            : { onAction: refetch, actionLabel: 'Erneut versuchen' })}
        />
      </div>
    )
  }

  const favorite = isFavorite(product.id)
  const similar = (similarData ?? []).map(normaliseProduct).filter((item) => item?.id && item.id !== product.id)
  const sellerItems = (sellerData ?? []).map(normaliseProduct).filter((item) => item?.id && item.id !== product.id)
  const seller = product.seller ?? {}
  const sellerId = getId(seller)
  const contactPath = `/nachrichten?product=${encodeURIComponent(product.id)}${sellerId ? `&seller=${encodeURIComponent(sellerId)}` : ''}`
  const sellerName = !sellerId
    ? 'Privatverkäufer:in'
    : displayName(seller) === 'Mein Konto'
      ? seller.email || `ID ${sellerId}`
      : displayName(seller)
  const reviewSummary = reviewsData?.summary ?? { average: 0, count: 0 }
  const reviews = Array.isArray(reviewsData?.reviews) ? reviewsData.reviews.slice(0, 3) : []
  const imageUrl = getImageUrl(images[mainImage])

  return (
    <div className="container-x py-8">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" /> Zurück
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="surface overflow-hidden">
            <div className="relative aspect-square bg-sand-100">
              {imageUrl ? (
                <img src={imageUrl} alt={product.title} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-brand-700">
                  <Package className="size-24 opacity-30" strokeWidth={1.2} />
                </div>
              )}
              <span className="badge absolute top-4 left-4 bg-white/95 text-brand-900 shadow-sm">
                {conditionLabel(product.condition)}
              </span>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setImageSelection({ id, index })}
                    aria-label={`Bild ${index + 1} anzeigen`}
                    className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${index === mainImage ? 'border-brand-700' : 'border-transparent hover:border-brand-200'}`}
                  >
                    <img src={getImageUrl(image)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wider text-brand-600 uppercase">
                {typeof product.category === 'object' ? product.category?.name : product.category || 'Second-Hand'}
              </p>
              <h1 className="mt-2 text-2xl leading-tight font-extrabold sm:text-3xl">{product.title}</h1>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => toggleFavorite(product)} aria-label={favorite ? 'Favorit entfernen' : 'Zu Favoriten hinzufügen'} className="grid size-10 place-items-center rounded-xl border border-brand-900/10 bg-white hover:bg-brand-50">
                <Heart className={`size-5 ${favorite ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
              </button>
              <button type="button" onClick={handleShare} aria-label="Angebot teilen" className="grid size-10 place-items-center rounded-xl border border-brand-900/10 bg-white hover:bg-brand-50">
                <Share2 className="size-5 text-slate-500" />
              </button>
            </div>
          </div>

          <p className="mt-4 text-3xl font-extrabold text-brand-800">{formatEUR(product.price)}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="badge bg-brand-50 text-brand-800"><ShieldCheck className="size-3.5" /> Käuferschutz</span>
            <span className="badge bg-sand-100 text-sand-800"><PackageCheck className="size-3.5" /> {conditionLabel(product.condition)}</span>
            {product.availability && <span className="badge bg-brand-50 text-brand-800">{product.availability}</span>}
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-brand-900/8 bg-white p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-slate-600"><MapPin className="size-4 text-brand-600" /> {product.city || 'Ort nicht angegeben'} {product.postalCode && `(${product.postalCode})`}</p>
            <p className="flex items-center gap-2 text-slate-600"><Truck className="size-4 text-brand-600" /> {product.shipping?.available || product.shipping === true ? 'Versand möglich' : 'Abholung'}</p>
            {product.brand && <p className="flex items-center gap-2 text-slate-600"><Package className="size-4 text-brand-600" /> Marke: {product.brand}</p>}
            {product.createdAt && <p className="flex items-center gap-2 text-slate-600"><PackageCheck className="size-4 text-brand-600" /> Eingestellt am {formatDate(product.createdAt)}</p>}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { addToCart(product); success('Zum Warenkorb hinzugefügt.') }}
              className="btn-primary flex-1 py-3"
            >
              <ShoppingCart className="size-5" /> In den Warenkorb
            </button>
            <Link to={contactPath} className="btn-outline flex-1 py-3">
              <MessageCircle className="size-5" /> Verkäufer:in kontaktieren
            </Link>
          </div>

          <div className="card mt-6 p-5">
            <h2 className="text-lg font-extrabold">Beschreibung</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description || 'Keine Beschreibung vorhanden.'}</p>
          </div>

          <div className="card mt-4 p-5">
            <h2 className="text-lg font-extrabold">Über die Verkäufer:in</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-100 font-extrabold text-brand-800">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-brand-950">{sellerName}</p>
                <Rating value={seller.rating} count={seller.reviewCount} />
              </div>
              <Link to={contactPath} className="btn-outline px-3 py-2 text-xs">
                <MessageCircle className="size-4" /> Nachricht
              </Link>
            </div>
            {seller.createdAt && <p className="mt-3 text-xs text-slate-500">Mitglied seit {formatDate(seller.createdAt, { month: 'short', year: 'numeric' })}</p>}
          </div>

          <div className="card mt-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-extrabold">Bewertungen zum Angebot</h2>
              {!reviewsLoading && !reviewsError && reviewSummary.count > 0 && (
                <Rating value={reviewSummary.average} count={reviewSummary.count} />
              )}
            </div>
            {reviewsLoading ? (
              <Loader label="Bewertungen werden geladen …" />
            ) : reviewsError ? (
              <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{reviewsError.message}</p>
            ) : reviews.length === 0 ? (
              <p className="mt-3 rounded-xl bg-sand-100 p-4 text-sm text-slate-600">
                Für dieses Angebot liegen noch keine Bewertungen vor.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review, index) => (
                  <li key={review.id ?? review._id ?? index} className="border-t border-brand-900/8 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-brand-950">{personLabel(review.buyer ?? review.user ?? review.author)}</p>
                      <Rating value={review.rating} showValue={false} />
                    </div>
                    {review.text && <p className="mt-1 text-sm text-slate-600">{review.text}</p>}
                    {review.createdAt && <p className="mt-1 text-xs text-slate-400">{formatDate(review.createdAt)}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="button" onClick={() => setReportOpen(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600">
            <Flag className="size-3.5" /> Angebot melden
          </button>
        </div>
      </div>

      <section className="mt-16">
        <SectionHeader title="Ähnliche Angebote" subtitle="Vielleicht findest du hier etwas Passendes." to="/marktplatz" actionLabel="Mehr entdecken" />
        {similar.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        ) : (
          <EmptyState title="Keine ähnlichen Angebote gefunden" description="Schau gerne direkt im Marktplatz nach weiteren Schätzen." to="/marktplatz" actionLabel="Marktplatz öffnen" />
        )}
      </section>

      {product.seller && (
        <section className="mt-14">
          <SectionHeader title="Mehr von dieser Verkäufer:in" />
          {sellerItems.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sellerItems.slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          ) : (
            <EmptyState title="Noch keine weiteren Angebote" description="Aktuell sind keine weiteren Angebote dieser Verkäufer:in verfügbar." />
          )}
        </section>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-brand-950/60 p-4" role="dialog" aria-modal="true" aria-label="Angebot melden">
          <form onSubmit={handleReport} className="w-full max-w-md animate-pop-in rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold">Angebot melden</h2>
            <p className="mt-2 text-sm text-slate-600">Hilf uns, SwapThrift sicher zu halten. Deine Meldung wird vertraulich geprüft.</p>
            <label className="label mt-5" htmlFor="report-reason">Grund</label>
            <select id="report-reason" className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              {reportReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
            </select>
            <label className="label mt-4" htmlFor="report-note">Zusätzliche Hinweise (optional)</label>
            <textarea id="report-note" rows={3} className="input resize-none" value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Beschreibe kurz, was dir aufgefallen ist" />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="btn-outline">Abbrechen</button>
              <button type="submit" disabled={reportBusy} className="btn-danger">{reportBusy ? 'Wird gesendet …' : 'Meldung senden'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
