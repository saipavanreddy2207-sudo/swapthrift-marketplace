import { ArrowRight, MapPin, Package, PencilLine, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Loader } from '../components/Loader'
import Rating from '../components/Rating'
import { useAuth } from '../context/AuthContext'
import useApi from '../hooks/useApi'
import ordersService from '../services/orders'
import productsService, { normaliseProduct } from '../services/products'
import { apiErrorMessage } from '../utils/apiError'
import { getId, personLabel } from '../utils/entities'
import { displayName, formatDate, getImageUrl } from '../utils/format'

export default function SellerProfile() {
  const { user } = useAuth()
  const userId = getId(user)

  const reviews = useApi(() => ordersService.reviews({ seller: userId }), [userId])
  const products = useApi(() => productsService.list({ limit: 50 }), [])

  const summary = reviews.data?.summary ?? { average: 0, count: 0 }
  const reviewList = (reviews.data?.reviews ?? []).slice(0, 4)
  const ownProducts = (products.data?.items ?? [])
    .map(normaliseProduct)
    .filter((product) => product && getId(product.seller ?? product.sellerId) === userId)
  const image = getImageUrl(user?.avatar)

  return (
    <div className="container-x py-10">
      <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Verkäuferbereich</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Verkäuferprofil</h1>

      <div className="surface mt-8 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-8 text-white" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-brand-100 text-3xl font-extrabold text-brand-800">
                {image ? <img src={image} alt="" className="size-full object-cover" /> : displayName(user).charAt(0).toUpperCase()}
              </span>
              <div className="pb-1">
                <h2 className="text-2xl font-extrabold">{displayName(user)}</h2>
                <p className="text-sm text-slate-500">{user?.email || 'Keine E-Mail angegeben'}</p>
              </div>
            </div>
            <Link to="/profil" className="btn-outline px-3 py-2 text-xs"><PencilLine className="size-4" /> Profil bearbeiten</Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-brand-900/8 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Star className="size-4" /> Bewertungen</p>
              {reviews.loading ? (
                <p className="mt-3 text-sm text-slate-500">Wird geladen …</p>
              ) : reviews.error ? (
                <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{apiErrorMessage(reviews.error)}</p>
              ) : (
                <div className="mt-3"><Rating value={summary.average} count={summary.count} /></div>
              )}
            </div>
            <div className="rounded-xl border border-brand-900/8 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Package className="size-4" /> Inserate</p>
              {products.loading ? (
                <p className="mt-3 text-sm text-slate-500">Wird geladen …</p>
              ) : products.error ? (
                <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{apiErrorMessage(products.error)}</p>
              ) : (
                <p className="mt-3 text-2xl font-extrabold text-brand-950">{ownProducts.length}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">aus den ersten 50 Angeboten</p>
            </div>
            <div className="rounded-xl border border-brand-900/8 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><MapPin className="size-4" /> Standort</p>
              <p className="mt-3 text-sm font-bold text-brand-950">{[user?.city, user?.postalCode].filter(Boolean).join(' ') || 'Nicht angegeben'}</p>
              {user?.createdAt && <p className="mt-1 text-xs text-slate-500">Mitglied seit {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</p>}
            </div>
          </div>

          {user?.bio && <div className="mt-6 rounded-xl bg-sand-100 p-5"><h3 className="text-sm font-extrabold">Über mich</h3><p className="mt-2 whitespace-pre-line text-sm text-slate-600">{user.bio}</p></div>}
        </div>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="text-xl font-extrabold">Bewertungen</h2>
        {reviews.loading ? (
          <Loader label="Bewertungen werden geladen …" />
        ) : reviews.error ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{apiErrorMessage(reviews.error)}</p>
        ) : reviewList.length === 0 ? (
          <p className="mt-4 rounded-xl bg-sand-100 p-5 text-sm text-slate-600">Noch keine Bewertungen vorhanden. Bewertungen erscheinen hier nach abgeschlossenen Verkäufen.</p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-900/8">
            {reviewList.map((review, index) => (
              <li key={getId(review) || index} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-brand-950">{personLabel(review.buyer ?? review.user ?? review.author)}</p>
                  <Rating value={review.rating} />
                </div>
                {review.text && <p className="mt-2 text-sm text-slate-600">{review.text}</p>}
                {review.createdAt && <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/verkaeufer" className="btn-primary"><Store className="size-4" /> Meine Inserate verwalten <ArrowRight className="size-4" /></Link>
        <Link to="/verkaufen" className="btn-outline">Neues Inserat erstellen</Link>
      </div>
    </div>
  )
}
