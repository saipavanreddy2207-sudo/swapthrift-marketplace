import { Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({ compact = false, light = false, showTagline = true }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="SwapThrift Startseite">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-white shadow-soft transition-transform duration-300 group-hover:-rotate-6 sm:size-11">
        <Recycle className="size-6" strokeWidth={2.2} aria-hidden="true" />
        <span className="absolute -right-2 -bottom-3 size-6 rounded-full bg-sand-300/70 blur-[2px]" />
      </span>
      <span className="leading-none">
        <span className={`block text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-950'}`}>
          Swap<span className="text-brand-500">Thrift</span>
        </span>
        {showTagline && !compact && (
          <span className={`mt-1 block text-[10px] font-bold tracking-[0.16em] uppercase ${light ? 'text-brand-100' : 'text-sand-700'}`}>
            Gutes finden. Weitergeben.
          </span>
        )}
      </span>
    </Link>
  )
}
