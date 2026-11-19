import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SectionHeader({ title, subtitle, to, actionLabel = 'Alle ansehen', icon: Icon }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-5 text-brand-600" />}
          <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        </div>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
          {actionLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
