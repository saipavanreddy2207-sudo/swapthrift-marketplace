import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Hier ist noch nichts zu sehen',
  description = 'Sobald neue Angebote verfügbar sind, erscheinen sie an dieser Stelle.',
  actionLabel,
  to,
  onAction,
}) {
  return (
    <div className="surface flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-700">
        <Icon className="size-8" strokeWidth={1.7} />
      </span>
      <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      {(to || onAction) && (
        <div className="mt-6">
          {to ? (
            <Link to={to} className="btn-primary">{actionLabel || 'Weiter stöbern'}</Link>
          ) : (
            <button type="button" onClick={onAction} className="btn-primary">{actionLabel || 'Erneut versuchen'}</button>
          )}
        </div>
      )}
    </div>
  )
}
