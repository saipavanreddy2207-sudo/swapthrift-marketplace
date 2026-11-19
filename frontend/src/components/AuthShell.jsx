import { Leaf, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

const highlights = [
  { icon: TrendingDown, text: 'Günstiger einkaufen als neu' },
  { icon: Leaf, text: 'Ressourcen schonen' },
  { icon: ShieldCheck, text: 'Sicher und lokal handeln' },
]

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-brand-900/8 bg-white shadow-soft lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-brand-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-sand-400/20 blur-3xl" />
          <div className="relative">
            <Logo light />
            <h2 className="mt-14 text-3xl leading-tight font-extrabold text-white">
              Second-Hand.<br />First-Choice.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100">
              Wer bei SwapThrift kauft oder verkauft, gibt Dingen ein zweites Leben – und spart dabei Geld.
            </p>
          </div>
          <ul className="relative mt-12 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-semibold text-brand-100">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-sand-300">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="relative mt-12 flex items-center gap-2 text-xs font-bold tracking-wider text-sand-300 uppercase">
            <Sparkles className="size-4" /> Gutes finden. Weitergeben.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-brand-900/8 pt-6 text-sm text-slate-600">{footer}</div>}
          <p className="mt-8 text-center text-xs text-slate-400">
            <Link to="/rechtliches/impressum" className="hover:text-brand-700">Impressum</Link>
            {' · '}
            <Link to="/rechtliches/datenschutz" className="hover:text-brand-700">Datenschutz</Link>
            {' · '}
            <Link to="/rechtliches/agb" className="hover:text-brand-700">AGB</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
