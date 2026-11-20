import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Camera,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Heart,
  HeartHandshake,
  Leaf,
  MapPin,
  MessageCircle,
  PackageSearch,
  Recycle,
  Search,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
  Store,
  Truck,
  UploadCloud,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { toList } from '../services/api'
import categoriesService from '../services/categories'
import productsService, { normaliseProduct } from '../services/products'
import useApi from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import CategoryCard from '../components/CategoryCard'
import FounderCorner from '../components/FounderCorner'
import EmptyState from '../components/EmptyState'
import Hero from '../components/Hero'
import { Loader, ProductGridSkeleton } from '../components/Loader'
import ProductCard from '../components/ProductCard'
import Rating from '../components/Rating'
import SectionHeader from '../components/SectionHeader'

const cities = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt']

function ProductSection({ title, subtitle, params, icon, to, actionLabel, extraDeps = [] }) {
  const key = JSON.stringify(params)
  const { data, loading, error, refetch } = useApi(
    () => productsService.list(params),
    [key, ...extraDeps],
  )
  const items = (data?.items ?? []).map(normaliseProduct).filter((item) => item?.id)

  return (
    <section className="container-x py-10">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} to={to} actionLabel={actionLabel} />
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <EmptyState
          title="Angebote konnten nicht geladen werden"
          description={error.message}
          actionLabel="Erneut versuchen"
          onAction={refetch}
        />
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="Noch keine Angebote in diesem Bereich"
          description="Sobald Verkäufer:innen passende Artikel einstellen, findest du sie hier."
          to="/marktplatz"
          actionLabel="Marktplatz öffnen"
        />
      )}
    </section>
  )
}

function TrustBar() {
  const items = [
    { icon: ShieldCheck, title: 'Sicher handeln', text: 'Klarer Käuferschutz' },
    { icon: MapPin, title: 'Aus deiner Nähe', text: 'Deutschlandweit' },
    { icon: CircleDollarSign, title: 'Fair einkaufen', text: 'Gute Preise, gute Ware' },
    { icon: Recycle, title: 'Nachhaltig', text: 'Weniger Müll, mehr Leben' },
  ]
  return (
    <div className="border-y border-brand-900/8 bg-white">
      <div className="container-x grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-brand-950">{title}</p>
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SellerHighlights() {
  const { data, loading } = useApi(async () => {
    const payload = await api.get('/sellers', { params: { limit: 4 } })
    return toList(payload, 'sellers')
  }, [])

  if (loading) return <Loader label="Verkäufer:innen werden geladen …" />
  if (!data?.length) {
    return (
      <EmptyState
        icon={UserRound}
        title="Verkäufer:innen folgen bald"
        description="Sobald das Verkäufer-Verzeichnis verfügbar ist, kannst du hier engagierte Verkäufer:innen entdecken."
        to="/marktplatz"
        actionLabel="Angebote entdecken"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((seller) => (
        <div key={seller.id ?? seller._id ?? seller.name} className="card p-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800">
            {(seller.name || seller.username || 'S').charAt(0).toUpperCase()}
          </span>
          <p className="mt-3 font-extrabold text-brand-950">{seller.name || seller.username || 'Verkäufer:in'}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3.5" /> {seller.city || 'Deutschland'}
          </p>
          <div className="mt-3 flex justify-center"><Rating value={seller.rating} count={seller.reviewCount} /></div>
        </div>
      ))}
    </div>
  )
}

function Newsletter() {
  const { success } = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return
    setSent(true)
    success('Danke für dein Interesse am SwapThrift-Newsletter.')
  }

  return (
    <section className="container-x py-14">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-white sm:px-12">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-sand-400/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="badge bg-white/10 text-sand-200"><Sparkles className="size-3.5" /> Newsletter</span>
            <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">Kein Schatz mehr verpassen</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100">
              Erhalte Neuigkeiten, besondere Fundstücke und Tipps rund um nachhaltiges Einkaufen.
            </p>
          </div>
          {sent ? (
            <div className="rounded-2xl border border-brand-400/40 bg-white/10 p-6 text-center text-sm font-semibold">
              <BadgeCheck className="mx-auto size-8 text-sand-300" />
              <p className="mt-3">Vielen Dank! Der Newsletter-Dienst wird derzeit eingerichtet.</p>
              <button type="button" onClick={() => { setSent(false); setEmail('') }} className="mt-3 text-sand-200 underline underline-offset-4">
                Weitere E-Mail anmelden
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="newsletter-email">E-Mail-Adresse</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="deine@email.de"
                className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-brand-950 outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="btn-accent shrink-0">Anmelden <ArrowRight className="size-4" /></button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [city, setCity] = useState(cities[0])
  const { data: categories, loading: categoriesLoading } = useApi(() => categoriesService.list(), [])

  return (
    <>
      <FounderCorner />
      <Hero />
      <TrustBar />

      <section className="container-x py-14">
        <SectionHeader
          title="Entdecke nach Kategorie"
          subtitle="Von der Vintage-Lampe bis zum fast neuen Fahrrad – für jeden Geschmack ist etwas dabei."
          to="/marktplatz"
          actionLabel="Alle Kategorien"
          icon={Sofa}
        />
        {categoriesLoading ? (
          <Loader label="Kategorien werden geladen …" />
        ) : categories?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => <CategoryCard key={category.id ?? category.slug} category={category} />)}
          </div>
        ) : (
          <EmptyState
            icon={Sofa}
            title="Kategorien werden geladen"
            description="Der Katalog ist derzeit nicht erreichbar. Bitte versuche es in Kürze erneut – alle Angebote findest du schon jetzt auf dem Marktplatz."
            to="/marktplatz"
            actionLabel="Zum Marktplatz"
          />
        )}
      </section>

      <div className="bg-white/60">
        <ProductSection
          title="Beliebte Fundstücke"
          subtitle="Das, was bei SwapThrift gerade besonders gut ankommt."
          params={{ sort: 'popular', limit: 8 }}
          icon={Sparkles}
          to="/marktplatz?sort=popular"
        />
      </div>

      <ProductSection
        title="Neu eingetroffen"
        subtitle="Frisch eingestellt – vielleicht ist dein neues Lieblingsstück dabei."
        params={{ sort: 'newest', limit: 8 }}
        icon={Clock3}
        to="/marktplatz?sort=newest"
        actionLabel="Alle Neuheiten"
      />

      <div className="bg-white/60">
        <ProductSection
          title="Empfohlen für dich"
          subtitle="Eine kleine Auswahl aus unserem Sortiment."
          params={{ limit: 4 }}
          icon={HeartHandshake}
          to="/marktplatz"
        />
      </div>

      <section className="container-x py-14">
        <SectionHeader
          title="In deiner Nähe entdecken"
          subtitle="Second-Hand aus deiner Stadt – kurzer Weg, direkt Kontakt."
          icon={MapPin}
          to="/marktplatz"
          actionLabel="Deutschlandweit suchen"
        />
        <div className="mb-6 flex flex-wrap gap-2">
          {cities.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCity(item)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                city === item ? 'bg-brand-800 text-white shadow-soft' : 'bg-white text-brand-900 hover:bg-brand-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <ProductSection
          title={`Angebote aus ${city}`}
          params={{ city, limit: 4, sort: 'newest' }}
          extraDeps={[city]}
          icon={MapPin}
          to={`/marktplatz?city=${encodeURIComponent(city)}`}
          actionLabel={`Alle aus ${city}`}
        />
      </section>

      <section className="container-x py-14">
        <SectionHeader title="Verkäufer:innen im Fokus" subtitle="Menschen, die ihre Schätze mit Sorgfalt weitergeben." icon={Store} />
        <SellerHighlights />
      </section>

      <section className="container-x py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface p-8 sm:p-10">
            <span className="badge bg-brand-50 text-brand-800"><ShieldCheck className="size-3.5" /> Trust & Safety</span>
            <h2 className="mt-4 text-2xl font-extrabold">Sicher einkaufen, entspannt verkaufen</h2>
            <div className="mt-6 space-y-5">
              {[
                { icon: BadgeCheck, title: 'Geprüfte Inserate', text: 'Unsere Richtlinien helfen dir, vertrauenswürdige Angebote zu erkennen.' },
                { icon: MessageCircle, title: 'Direkte Kommunikation', text: 'Frag nach Details, Maßen oder Versand – direkt über den Nachrichtendienst.' },
                { icon: Truck, title: 'Klarer Versand', text: 'Versand oder Abholung wird bereits im Inserat transparent angegeben.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" /></span>
                  <div>
                    <p className="text-sm font-extrabold text-brand-950">{title}</p>
                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/rechtliches/marktplatzregeln" className="btn-outline mt-8">Unsere Marktplatzregeln <ChevronRight className="size-4" /></Link>
          </div>
          <div className="surface overflow-hidden bg-gradient-to-br from-brand-900 to-brand-800 p-8 text-white sm:p-10">
            <span className="badge bg-white/10 text-sand-200"><Leaf className="size-3.5" /> Nachhaltigkeit</span>
            <h2 className="mt-4 text-2xl font-extrabold text-white">Jedes Teil verdient ein zweites Leben</h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100">
              Neu kaufen muss nicht sein. Wer gebrauchte Dinge weiterverwendet, spart Ressourcen, Energie und Geld.
              Mit jedem Inserat auf SwapThrift wird aus Aussortiertem wieder ein Schatz.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Search, label: 'Finden' },
                { icon: Heart, label: 'Lieben' },
                { icon: Recycle, label: 'Weitergeben' },
              ].map(({ icon: Icon, label }, index) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4 text-center">
                  <Icon className="mx-auto size-6 text-sand-300" />
                  <p className="mt-2 text-xs font-bold text-white">{index + 1}. {label}</p>
                </div>
              ))}
            </div>
            <Link to="/verkaufen" className="btn-accent mt-8">Jetzt selbst verkaufen <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="container-x">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Camera, title: 'Einfach fotografieren', text: 'Gute Bilder machen den Unterschied.' },
            { icon: Bike, title: 'Fair beschreiben', text: 'Ehrliche Zustandsangaben schaffen Vertrauen.' },
            { icon: UploadCloud, title: 'Kostenlos inserieren', text: 'In wenigen Minuten online und erreichbar.' },
            { icon: Shirt, title: 'Alles darf dabei sein', text: 'Kleidung, Möbel, Technik und mehr.' },
            { icon: Store, title: 'Lokal oder deutschlandweit', text: 'Du entscheidest über Versand und Abholung.' },
            { icon: Leaf, title: 'Gutes bewirken', text: 'Weniger Abfall, mehr Freude am Weitergeben.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex items-start gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand-100 text-sand-700"><Icon className="size-5" /></span>
              <div>
                <p className="text-sm font-extrabold text-brand-950">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Newsletter />
    </>
  )
}
