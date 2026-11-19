import { Loader2 } from 'lucide-react'

export function Loader({ label = 'Wird geladen …', fullPage = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-slate-500 ${fullPage ? 'min-h-[50vh]' : ''}`}>
      <Loader2 className="size-8 animate-spin text-brand-600" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="aspect-square animate-pulse bg-sand-200" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Loader
