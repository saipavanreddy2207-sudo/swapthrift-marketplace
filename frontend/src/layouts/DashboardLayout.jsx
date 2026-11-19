import {
  ArrowLeft,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import ScrollToTop from '../components/ScrollToTop'
import { displayName as getDisplayName } from '../utils/format'
import Toast from '../components/Toast'

const buyerLinks = [
  { to: '/dashboard', label: 'Übersicht', icon: LayoutDashboard, end: true },
  { to: '/bestellungen', label: 'Meine Bestellungen', icon: ShoppingBag },
  { to: '/favoriten', label: 'Favoriten', icon: Heart },
  { to: '/nachrichten', label: 'Nachrichten', icon: MessageCircle },
  { to: '/profil', label: 'Mein Profil', icon: Settings },
]

const sellerLinks = [
  { to: '/verkaeufer', label: 'Verkäufer-Übersicht', icon: Store, end: true },
  { to: '/verkaeufer/profil', label: 'Verkäuferprofil', icon: Store },
  { to: '/verkaufen', label: 'Neues Inserat', icon: PlusCircle },
]

function SideLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
          isActive ? 'bg-brand-800 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-900'
        }`
      }
    >
      <Icon className="size-4.5" /> {label}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, isAdmin } = useAuth()
  const displayName = getDisplayName(user)

  return (
    <div className="min-h-screen bg-sand-50">
      <ScrollToTop />
      <div className="border-b border-brand-900/8 bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo compact />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-600 sm:block">Hallo, {displayName}</span>
            <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-800">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <Link to="/" className="btn-ghost hidden sm:inline-flex">
              <ArrowLeft className="size-4" /> Zur Website
            </Link>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <nav className="card space-y-6 p-4" aria-label="Dashboard-Navigation">
            <div>
              <p className="px-3 pb-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">Käuferbereich</p>
              <div className="space-y-1">
                {buyerLinks.map((link) => <SideLink key={link.to} {...link} />)}
              </div>
            </div>
            <div className="divider" />
            <div>
              <p className="px-3 pb-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">Verkäuferbereich</p>
              <div className="space-y-1">
                {sellerLinks.map((link) => <SideLink key={link.to} {...link} />)}
              </div>
            </div>
            {isAdmin && (
              <>
                <div className="divider" />
                <div>
                  <p className="px-3 pb-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">Verwaltung</p>
                  <SideLink to="/admin" label="Admin-Dashboard" icon={Package} />
                </div>
              </>
            )}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
      <Toast />
    </div>
  )
}
