import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Loader'
import ProductCard from '../components/ProductCard'
import useApi from '../hooks/useApi'
import categoriesService from '../services/categories'
import productsService, { normaliseProduct } from '../services/products'

const conditions = [
  { value: 'Neu', label: 'Neu' },
  { value: 'Wie neu', label: 'Wie neu' },
  { value: 'Sehr gut', label: 'Sehr gut' },
  { value: 'Gut', label: 'Gut' },
  { value: 'Akzeptabel', label: 'Akzeptabel' },
]

const sortOptions = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'popular', label: 'Beliebteste zuerst' },
  { value: 'price_asc', label: 'Preis: aufsteigend' },
  { value: 'price_desc', label: 'Preis: absteigend' },
]

function initialFilters(params) {
  return {
    q: params.get('q') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    city: params.get('city') || '',
    postalCode: params.get('postalCode') || '',
  }
}

function TopFilterBar({ params, categories, onApply, onToggleFilters, filtersOpen }) {
  const [query, setQuery] = useState(params.get('q') || '')

  function handleSubmit(event) {
    event.preventDefault()
    onApply({ q: query })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-900/8 bg-white p-3 shadow-card sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          aria-label="Suchbegriff"
          placeholder="Suchbegriff eingeben"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <select
        className="input sm:w-52"
        aria-label="Kategorie"
        value={params.get('category') || ''}
        onChange={(event) => onApply({ category: event.target.value })}
      >
        <option value="">Alle Kategorien</option>
        {categories.map((category) => (
          <option key={category.id ?? category.slug} value={category.slug ?? category.id}>{category.name}</option>
        ))}
      </select>
      <button type="submit" className="btn-primary">Filtern</button>
      <button type="button" onClick={onToggleFilters} className="btn-outline sm:hidden" aria-expanded={filtersOpen}>
        <SlidersHorizontal className="size-4" /> Weitere Filter
      </button>
    </form>
  )
}

function FilterPanel({ params, onApply, onReset }) {
  const [filters, setFilters] = useState(() => initialFilters(params))

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onApply({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      city: filters.city,
      postalCode: filters.postalCode,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card sticky top-24 space-y-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-extrabold"><Filter className="size-4 text-brand-600" /> Filter</h2>
        <button type="button" onClick={onReset} className="text-xs font-bold text-brand-700 hover:underline">Zurücksetzen</button>
      </div>

      <div>
        <p className="label">Preis (EUR)</p>
        <div className="flex items-center gap-2">
          <input className="input" inputMode="decimal" placeholder="Min" aria-label="Mindestpreis" value={filters.minPrice} onChange={(e) => update('minPrice', e.target.value)} />
          <span className="text-slate-400">–</span>
          <input className="input" inputMode="decimal" placeholder="Max" aria-label="Höchstpreis" value={filters.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="filter-condition">Zustand</label>
        <select id="filter-condition" className="input" value={params.get('condition') || ''} onChange={(e) => onApply({ condition: e.target.value })}>
          <option value="">Alle Zustände</option>
          {conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="filter-city"><MapPin className="mr-1 inline size-3.5" />Ort</label>
        <input id="filter-city" className="input" placeholder="z. B. Berlin" value={filters.city} onChange={(e) => update('city', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="filter-zip">Postleitzahl</label>
        <input id="filter-zip" className="input" inputMode="numeric" maxLength={5} placeholder="10115" value={filters.postalCode} onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))} />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand-50 p-3 text-sm font-semibold text-brand-950">
        <input type="checkbox" className="size-4 accent-brand-700" checked={params.get('shipping') === 'true'} onChange={(e) => onApply({ shipping: e.target.checked ? 'true' : '' })} />
        <Truck className="size-4 text-brand-700" /> Versand verfügbar
      </label>

      <button type="submit" className="btn-primary w-full">Filter anwenden</button>
    </form>
  )
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryKey = searchParams.toString()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: categoriesData } = useApi(() => categoriesService.list(), [])
  const categories = categoriesData ?? []
  const { data, loading, error, refetch } = useApi(
    () => productsService.list(Object.fromEntries(searchParams.entries())),
    [queryKey],
  )

  const items = (data?.items ?? []).map(normaliseProduct).filter((item) => item?.id)
  const pagination = data?.pagination
  const page = Number(searchParams.get('page') || 1)
  const perPage = Number(searchParams.get('limit') || 12)
  const total = Number(pagination?.total ?? items.length)
  const totalPages = Math.max(
    1,
    Number(pagination?.pages ?? pagination?.totalPages ?? Math.ceil(total / perPage)) || 1,
  )

  function applyValues(values, { closeFilters = false } = {}) {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, String(value))
      else next.delete(key)
    })
    next.set('page', '1')
    setSearchParams(next)
    if (closeFilters) setFiltersOpen(false)
  }

  function setParam(key, value) {
    applyValues({ [key]: value })
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams())
    setFiltersOpen(false)
  }

  const activeFilters = [
    ['q', 'Suche'],
    ['category', 'Kategorie'],
    ['condition', 'Zustand'],
    ['minPrice', 'Ab'],
    ['maxPrice', 'Bis'],
    ['city', 'Ort'],
    ['postalCode', 'PLZ'],
    ['shipping', 'Versand'],
  ].filter(([key]) => searchParams.get(key))

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Entdecken</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Marktplatz</h1>
        <p className="mt-2 text-sm text-slate-600">
          {loading ? 'Angebote werden geladen …' : `${total} ${total === 1 ? 'Angebot' : 'Angebote'} gefunden`}
        </p>
      </div>

      <TopFilterBar
        key={`top-${queryKey}`}
        params={searchParams}
        categories={categories}
        onApply={(values) => applyValues(values)}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        filtersOpen={filtersOpen}
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <FilterPanel
            key={`panel-${queryKey}`}
            params={searchParams}
            onApply={(values) => applyValues(values, { closeFilters: true })}
            onReset={resetFilters}
          />
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="sort">Sortierung</label>
            <select id="sort" className="input w-auto min-w-52" value={searchParams.get('sort') || ''} onChange={(e) => setParam('sort', e.target.value)}>
              <option value="">Standard-Sortierung</option>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setParam(key, '')}
                    className="badge bg-brand-50 text-brand-800 hover:bg-brand-100"
                  >
                    {label}: {searchParams.get(key)} <X className="size-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <EmptyState
              icon={PackageSearch}
              title="Angebote konnten nicht geladen werden"
              description={error.message}
              actionLabel="Erneut versuchen"
              onAction={refetch}
            />
          ) : items.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Seitennavigation">
                  <button type="button" disabled={page <= 1} onClick={() => setParam('page', page - 1)} className="btn-outline px-3" aria-label="Vorherige Seite">
                    <ChevronLeft className="size-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    const target = Math.max(1, Math.min(totalPages - 4, page - 2)) + index
                    if (target > totalPages) return null
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => setParam('page', target)}
                        className={`size-10 rounded-xl text-sm font-bold transition-colors ${target === page ? 'bg-brand-800 text-white' : 'bg-white text-brand-900 hover:bg-brand-50'}`}
                      >
                        {target}
                      </button>
                    )
                  })}
                  <button type="button" disabled={page >= totalPages} onClick={() => setParam('page', page + 1)} className="btn-outline px-3" aria-label="Nächste Seite">
                    <ChevronRight className="size-4" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="Keine passenden Angebote gefunden"
              description="Versuche es mit anderen Suchbegriffen oder entferne einige Filter."
              actionLabel="Filter zurücksetzen"
              onAction={resetFilters}
            />
          )}
        </div>
      </div>
    </div>
  )
}
