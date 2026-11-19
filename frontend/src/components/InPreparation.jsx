import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function InPreparation({ title, description, features = [], to = '/marktplatz', actionLabel = 'Zum Marktplatz' }) {
  return (
    <div className="surface overflow-hidden">
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-8 text-white sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-sand-200">
          <Clock3 className="size-4" /> In Vorbereitung
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-100">{description}</p>
      </div>
      <div className="p-8 sm:p-10">
        <h3 className="text-sm font-extrabold tracking-wider text-slate-500 uppercase">Geplant für diesen Bereich</h3>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 rounded-xl bg-sand-50 p-4 text-sm font-semibold text-brand-950">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
              {feature}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Diese Funktionen werden erst mit den entsprechenden Backend-Schnittstellen freigeschaltet. Bis dahin
          werden hier keine Beispieldaten angezeigt.
        </p>
        <Link to={to} className="btn-outline mt-6">
          {actionLabel} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
