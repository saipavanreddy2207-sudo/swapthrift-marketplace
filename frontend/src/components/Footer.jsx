import { Heart, Leaf, Mail, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

const currentYear = new Date().getFullYear()

const columns = [
  {
    title: 'Marktplatz',
    links: [
      { label: 'Alle Angebote', to: '/marktplatz' },
      { label: 'Neu eingetroffen', to: '/marktplatz?sort=newest' },
      { label: 'Jetzt verkaufen', to: '/verkaufen' },
      { label: 'Kostenlos registrieren', to: '/registrieren' },
    ],
  },
  {
    title: 'Für dich',
    links: [
      { label: 'Meine Favoriten', to: '/favoriten' },
      { label: 'Warenkorb', to: '/warenkorb' },
      { label: 'Meine Bestellungen', to: '/bestellungen' },
      { label: 'Nachrichten', to: '/nachrichten' },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Impressum', to: '/rechtliches/impressum' },
      { label: 'Datenschutz', to: '/rechtliches/datenschutz' },
      { label: 'AGB', to: '/rechtliches/agb' },
      { label: 'Widerrufsbelehrung', to: '/rechtliches/widerrufsbelehrung' },
      { label: 'Cookies', to: '/rechtliches/cookies' },
      { label: 'Community-Richtlinien', to: '/rechtliches/community-richtlinien' },
      { label: 'Marktplatzregeln', to: '/rechtliches/marktplatzregeln' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-950 text-brand-100">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-200">
              SwapThrift verbindet Menschen in ganz Deutschland, die gut erhaltene Dinge lieber weitergeben
              als wegwerfen. Second-Hand, der sich richtig anfühlt.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="badge bg-brand-800 text-brand-100"><ShieldCheck className="size-3.5" /> Käuferschutz</span>
              <span className="badge bg-brand-800 text-brand-100"><Truck className="size-3.5" /> Versand in DE</span>
              <span className="badge bg-brand-800 text-brand-100"><Leaf className="size-3.5" /> Nachhaltig</span>
            </div>
            <a href="mailto:kontakt@swapthrift.de" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sand-300 hover:text-sand-200">
              <Mail className="size-4" /> kontakt@swapthrift.de
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 text-sm font-extrabold tracking-wide text-white">{column.title}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="text-sm text-brand-200 transition-colors hover:text-sand-300">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-wider text-brand-300 uppercase">
              <PackageCheck className="size-4" /> Vorgesehene Zahlungsarten
            </p>
            <div className="flex flex-wrap gap-2">
              {['PayPal', 'Kreditkarte', 'SEPA-Überweisung', 'Klarna'].map((label) => (
                <span key={label} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-brand-100">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-wider text-brand-300 uppercase">
              <Truck className="size-4" /> Vorgesehene Versandwege
            </p>
            <div className="flex flex-wrap gap-2">
              {['DHL', 'Hermes', 'DPD', 'UPS', 'Abholung'].map((label) => (
                <span key={label} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-brand-100">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} SwapThrift · Mit Liebe in Deutschland gemacht.</p>
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5" /> Berlin · Deutschlandweit für dich da
            <Heart className="ml-2 size-3.5 fill-sand-400 text-sand-400" />
          </p>
          <p className="font-bold tracking-wide text-sand-300">Gutes finden. Weitergeben.</p>
        </div>
      </div>
    </footer>
  )
}
