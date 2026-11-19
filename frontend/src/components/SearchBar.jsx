import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({
  initialQuery = '',
  categories = [],
  initialCategory = '',
  size = 'normal',
  className = '',
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)

  function handleSubmit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('category', category)
    navigate(`/marktplatz${params.toString() ? `?${params}` : ''}`)
  }

  const large = size === 'large'

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`flex w-full items-stretch rounded-2xl border border-brand-900/10 bg-white p-1.5 shadow-card ${large ? 'min-h-16' : ''} ${className}`}
    >
      <label className="relative hidden min-w-0 flex-1 items-center sm:flex" htmlFor="search-query">
        <Search className="pointer-events-none absolute left-3 size-5 text-slate-400" aria-hidden="true" />
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Was suchst du? z. B. Vintage Lampe, Fahrrad, Kleidung …"
          className={`w-full bg-transparent py-2.5 pl-11 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 ${large ? 'text-base' : ''}`}
        />
      </label>
      <label className="relative hidden items-center border-l border-brand-900/10 pl-1 md:flex" htmlFor="search-category">
        <SlidersHorizontal className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden="true" />
        <select
          id="search-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="max-w-44 cursor-pointer bg-transparent py-2.5 pl-9 pr-6 text-sm font-semibold text-brand-900 outline-none"
        >
          <option value="">Alle Kategorien</option>
          {categories.map((item) => (
            <option key={item.id ?? item.slug} value={item.slug ?? item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="relative flex min-w-0 flex-1 items-center sm:hidden" htmlFor="search-query-mobile">
        <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden="true" />
        <input
          id="search-query-mobile"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Was suchst du?"
          className="w-full bg-transparent py-2 pl-9 pr-2 text-sm outline-none placeholder:text-slate-400"
        />
      </label>
      <button type="submit" className={`btn-primary shrink-0 ${large ? 'px-6 text-base' : 'px-3 sm:px-5'}`}>
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Suchen</span>
      </button>
    </form>
  )
}
