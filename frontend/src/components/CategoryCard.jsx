import { Armchair, Baby, Bike, BookOpen, Camera, Car, Gamepad2, Gem, Heart, Home, Package, Shirt, Smartphone, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = {
  armchair: Armchair,
  baby: Baby,
  bike: Bike,
  bookopen: BookOpen,
  books: BookOpen,
  camera: Camera,
  car: Car,
  electronics: Smartphone,
  fashion: Shirt,
  gamepad2: Gamepad2,
  gem: Gem,
  heart: Heart,
  home: Home,
  housing: Home,
  package: Package,
  smartphone: Smartphone,
  sparkles: Sparkles,
  tools: Wrench,
  other: Package,
}

export default function CategoryCard({ category }) {
  const rawIcon = String(category.icon ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const Icon = iconMap[rawIcon] ?? Package

  return (
    <Link
      to={`/marktplatz?category=${encodeURIComponent(category.slug ?? category.id ?? category.name)}`}
      className="group card flex flex-col items-center gap-3 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg sm:p-6"
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-all duration-300 group-hover:bg-brand-800 group-hover:text-white">
        <Icon className="size-7" strokeWidth={1.8} />
      </span>
      <div>
        <h3 className="text-sm font-extrabold text-brand-950">{category.name}</h3>
        {category.count > 0 && <p className="mt-1 text-xs text-slate-500">{category.count} Angebote</p>}
      </div>
    </Link>
  )
}
