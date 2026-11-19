import { Star } from 'lucide-react'

export default function Rating({ value = 0, count, size = 'sm', showValue = true }) {
  const rating = Number(value) || 0
  const rounded = Math.round(rating)
  const dimension = size === 'lg' ? 'size-5' : 'size-4'

  if (rating <= 0) {
    return <span className="text-xs font-semibold text-slate-500">Noch keine Bewertungen</span>
  }

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${rating.toFixed(1)} von 5 Sternen`}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${dimension} ${star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        ))}
      </span>
      {showValue && <span className="text-sm font-bold text-brand-950">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  )
}
