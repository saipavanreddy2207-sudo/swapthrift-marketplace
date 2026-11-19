import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-brand-50 text-brand-700"><Compass className="size-10" /></span>
      <p className="mt-6 text-sm font-extrabold tracking-widest text-brand-600 uppercase">Fehler 404</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Hier gibt es nichts zu finden</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
        Die Seite, die du suchst, wurde verschoben oder existiert nicht mehr. Auf dem Marktplatz warten
        jedoch viele Schätze auf dich.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary">Zur Startseite</Link>
        <Link to="/marktplatz" className="btn-outline">Zum Marktplatz</Link>
      </div>
    </div>
  )
}
