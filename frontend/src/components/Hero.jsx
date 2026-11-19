import { ArrowRight, Bike, Camera, Leaf, PackageCheck, Shirt, Sofa, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const floatingItems = [
  { icon: Bike, label: 'Fahrrad', position: 'top-8 left-4', color: 'bg-brand-100 text-brand-800', delay: '0s' },
  { icon: Sofa, label: 'Sofa', position: 'top-20 right-4', color: 'bg-sand-200 text-sand-900', delay: '0.4s' },
  { icon: Camera, label: 'Kamera', position: 'bottom-24 left-8', color: 'bg-white text-brand-800', delay: '0.8s' },
  { icon: Shirt, label: 'Vintage', position: 'right-8 bottom-8', color: 'bg-brand-50 text-brand-700', delay: '1.2s' },
]

const trustBadges = [
  { icon: PackageCheck, text: 'Geprüfte Angebote' },
  { icon: Leaf, text: 'Nachhaltig einkaufen' },
  { icon: Sparkles, text: 'Schätze entdecken' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-brand-700/40 blur-3xl" />
        <div className="absolute -right-24 -bottom-40 size-[32rem] rounded-full bg-sand-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 size-64 rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold tracking-wide text-sand-200">
            <Leaf className="size-4" /> Der nachhaltige Marktplatz für Deutschland
          </span>
          <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Gutes finden.
            <br />
            <span className="bg-gradient-to-r from-sand-200 to-brand-300 bg-clip-text text-transparent">Weitergeben.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Entdecke einzigartige Second-Hand-Schätze aus deiner Nähe – von Vintage-Möbeln bis zu nearly-new
            Lieblingsstücken. Günstiger einkaufen, länger nutzen, weniger wegwerfen.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/marktplatz" className="btn-accent px-6 py-3 text-base">
              Jetzt entdecken <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/verkaufen"
              className="btn px-6 py-3 text-base border border-white/25 bg-white/5 text-white hover:bg-white/12"
            >
              Jetzt verkaufen
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {trustBadges.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2 text-sm font-semibold text-brand-100">
                <Icon className="size-4 text-sand-300" /> {text}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden h-[26rem] lg:block" aria-hidden="true">
          <div className="absolute inset-10 rounded-[3rem] border border-white/10 bg-gradient-to-br from-brand-800/80 to-brand-950/80 backdrop-blur-sm" />
          <div className="absolute top-1/2 left-1/2 grid size-56 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-sand-300/30 bg-sand-200/10">
            <div className="grid size-40 place-items-center rounded-full bg-sand-300 text-brand-950 shadow-2xl">
              <Leaf className="size-20" strokeWidth={1.4} />
            </div>
          </div>
          {floatingItems.map(({ icon: Icon, label, position, color, delay }) => (
            <div
              key={label}
              className={`absolute ${position} flex items-center gap-2 rounded-2xl border border-white/20 bg-white/95 px-3 py-2.5 text-sm font-bold text-brand-950 shadow-xl ${color}`}
              style={{ animation: `fade-in 0.6s ease-out ${delay} both` }}
            >
              <Icon className="size-5" /> {label}
            </div>
          ))}
          <div className="absolute right-10 -bottom-2 rounded-2xl border border-white/15 bg-brand-900 px-4 py-3 shadow-xl">
            <p className="text-xs font-bold text-sand-300">Unser Motto</p>
            <p className="text-xl font-extrabold text-white">Lieber teilen als werfen</p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-brand-900/50">
        <div className="container-x flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-4 text-center text-xs font-bold tracking-wider text-brand-100 uppercase">
          <span>Deutschlandweit</span>
          <span>Kostenlos inserieren</span>
          <span>Sicher bezahlen</span>
          <span>Direkt mit Verkäufern sprechen</span>
        </div>
      </div>
    </section>
  )
}
