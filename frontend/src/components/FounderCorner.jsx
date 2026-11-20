import { Mail } from 'lucide-react'
import { CREATOR, creatorMailto } from '../config/creator'

export default function FounderCorner() {
  return (
    <aside
      aria-label={`${CREATOR.role}: ${CREATOR.name}`}
      className="pointer-events-none fixed bottom-3 left-3 z-40 w-[190px] sm:w-[225px]"
    >
      <div className="pointer-events-auto rounded-2xl border border-brand-900/10 bg-white/95 p-2.5 shadow-soft backdrop-blur">
        <div className="flex items-center gap-2.5">
          <img
            src={CREATOR.photo}
            alt=""
            width="600"
            height="800"
            className="size-9 shrink-0 rounded-xl object-cover ring-1 ring-brand-900/10"
          />
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.14em] text-brand-500 uppercase">
              {CREATOR.role}
            </p>
            <p className="truncate text-xs font-extrabold text-brand-950">{CREATOR.name}</p>
          </div>
        </div>
        <a
          href={creatorMailto}
          title={CREATOR.email}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5 text-[10px] font-bold text-brand-800 transition-colors hover:bg-brand-100"
        >
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{CREATOR.email}</span>
        </a>
      </div>
    </aside>
  )
}
