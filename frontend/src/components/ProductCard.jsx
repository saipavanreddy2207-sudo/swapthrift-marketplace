import { Heart, MapPin, Package, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { conditionLabel, formatEUR, getImageUrl } from '../utils/format'

export default function ProductCard({ product, className = '' }) {
  const { isFavorite, toggle } = useFavorites()
  const [imageFailed, setImageFailed] = useState(false)
  const image = getImageUrl(product?.images?.[0])
  const favorite = isFavorite(product?.id)
  const rating = Number(product?.seller?.rating ?? product?.rating ?? 0)

  return (
    <article
      className={`group card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <div className="relative aspect-square overflow-hidden bg-sand-100">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-sand-100 to-brand-100 text-brand-700">
            <Package className="size-14 opacity-40" strokeWidth={1.3} />
          </div>
        )}
        <span className="badge absolute top-3 left-3 bg-white/95 text-brand-900 shadow-sm backdrop-blur">
          {conditionLabel(product?.condition)}
        </span>
        <button
          type="button"
          onClick={() => toggle(product)}
          aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          className={`absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-all hover:scale-110 ${
            favorite ? 'text-red-500' : 'text-slate-500 hover:text-red-500'
          }`}
        >
          <Heart className={`size-5 ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <Link to={`/produkt/${product.id}`} className="block p-4">
        <h3 className="line-clamp-2 min-h-11 text-sm font-bold text-brand-950 transition-colors group-hover:text-brand-700">
          {product.title}
        </h3>
        <p className="mt-2 text-xl font-extrabold text-brand-800">{formatEUR(product.price)}</p>
        <div className="mt-3 space-y-1.5 border-t border-brand-900/8 pt-3 text-xs text-slate-500">
          {product.city && (
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 shrink-0 text-brand-600" /> {product.city}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-slate-600">
              {product.seller?.name || product.seller?.username || 'Privatverkäufer:in'}
            </span>
            {rating > 0 && (
              <span className="flex shrink-0 items-center gap-1 font-bold text-amber-600">
                <Star className="size-3 fill-current" /> {Number(rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
