import { Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'

export default function Favorites() {
  const { items, clear } = useFavorites()
  const { success } = useToast()

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Deine Auswahl</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Favoriten</h1>
          <p className="mt-2 text-sm text-slate-600">
            {items.length} {items.length === 1 ? 'Angebot' : 'Angebote'} gemerkt
          </p>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={() => { clear(); success('Favoriten wurden geleert.') }} className="btn-outline">
            <Trash2 className="size-4" /> Alle entfernen
          </button>
        )}
      </div>

      {items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Noch keine Favoriten"
          description="Tippe bei einem Angebot auf das Herz, um es hier zu speichern und später wiederzufinden."
          to="/marktplatz"
          actionLabel="Angebote entdecken"
        />
      )}

      {items.length > 0 && (
        <div className="mt-10 text-center">
          <Link to="/marktplatz" className="link-brand">Weitere Schätze entdecken →</Link>
        </div>
      )}
    </div>
  )
}
