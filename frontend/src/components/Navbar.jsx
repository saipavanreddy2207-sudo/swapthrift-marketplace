import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'
import { apiErrorMessage } from '../utils/apiError'
import categoriesService from '../services/categories'
import notificationsService from '../services/notifications'
import { getId } from '../utils/entities'
import { displayName as getDisplayName, formatDate, truncate } from '../utils/format'
import Logo from './Logo'
import SearchBar from './SearchBar'

const publicLinks = [
  { to: '/marktplatz', label: 'Marktplatz' },
  { to: '/verkaufen', label: 'Verkaufen' },
]

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          isActive ? 'text-brand-800' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

function CountBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-1.5 -right-2 grid min-w-5 place-items-center rounded-full bg-sand-400 px-1 text-[10px] font-extrabold text-brand-950">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function notificationLink(notification) {
  if (typeof notification?.link === 'string' && notification.link.startsWith('/')) return notification.link
  const conversationId = getId(notification?.conversationId ?? notification?.conversation)
  if (conversationId) return '/nachrichten'
  const orderId = getId(notification?.orderId ?? notification?.order)
  if (orderId) return '/bestellungen'
  const productId = getId(notification?.productId ?? notification?.product)
  if (productId) return `/produkt/${encodeURIComponent(productId)}`
  return '/dashboard'
}

function NotificationList({ notifications, onRead }) {
  if (!notifications.length) {
    return <p className="px-3 py-5 text-center text-sm text-slate-500">Keine Benachrichtigungen vorhanden.</p>
  }
  return (
    <ul className="max-h-80 overflow-y-auto">
      {notifications.map((notification, index) => {
        const id = getId(notification)
        const title = notification.title ?? notification.message ?? notification.text ?? 'Benachrichtigung'
        return (
          <li key={id || index}>
            <Link
              to={notificationLink(notification)}
              onClick={() => onRead(notification)}
              className={`block rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-50 ${notification.read === false || notification.isRead === false ? 'bg-brand-50/60' : ''}`}
            >
              <p className="text-xs font-extrabold text-brand-950">{truncate(title, 70)}</p>
              {notification.body && <p className="mt-0.5 text-xs text-slate-600">{truncate(notification.body, 90)}</p>}
              {notification.createdAt && <p className="mt-1 text-[10px] text-slate-400">{formatDate(notification.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { count: favoriteCount } = useFavorites()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const categoryRef = useRef(null)
  const userRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    let active = true
    categoriesService.list().then((items) => {
      if (active) setCategories(items)
    })
    return () => {
      active = false
    }
  }, [])

  /* oxlint-disable react/set-state-in-effect -- Benachrichtigungen werden beim Abmelden aus dem Kopfbereich entfernt. */
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return undefined
    }
    let active = true
    async function loadNotifications() {
      try {
        const payload = await notificationsService.list()
        if (!active) return
        setNotifications((payload.notifications ?? []).slice(0, 5))
        setUnreadCount(payload.unreadCount ?? 0)
      } catch {
        if (active) {
          setNotifications([])
          setUnreadCount(0)
        }
      }
    }
    loadNotifications()
    const timer = window.setInterval(loadNotifications, 30000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [isAuthenticated])
  /* oxlint-enable react/set-state-in-effect */

  /* oxlint-disable react/set-state-in-effect -- Menüs schließen beim Routenwechsel ist eine UI-Synchronisierung. */
  useEffect(() => {
    setMobileOpen(false)
    setCategoryOpen(false)
    setUserOpen(false)
    setNotificationOpen(false)
  }, [location.pathname, location.search])
  /* oxlint-enable react/set-state-in-effect */

  useEffect(() => {
    function onPointerDown(event) {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setCategoryOpen(false)
      if (userRef.current && !userRef.current.contains(event.target)) setUserOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setCategoryOpen(false)
        setUserOpen(false)
        setMobileOpen(false)
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function handleMarkAllRead() {
    try {
      await notificationsService.markAllRead()
      setUnreadCount(0)
      setNotifications((current) => current.map((entry) => ({ ...entry, read: true, isRead: true })))
      success('Alle Benachrichtigungen wurden als gelesen markiert.')
    } catch (error) {
      toastError(apiErrorMessage(error))
    }
  }

  async function handleNotificationRead(notification) {
    const id = getId(notification)
    if (!id) return
    try {
      await notificationsService.markRead(id)
      setNotifications((current) => current.map((entry) => (getId(entry) === id ? { ...entry, read: true, isRead: true } : entry)))
      const payload = await notificationsService.list()
      setUnreadCount(payload.unreadCount ?? 0)
    } catch (error) {
      toastError(apiErrorMessage(error))
    }
  }

  async function handleLogout() {
    try {
      await logout()
      success('Du wurdest abgemeldet. Bis bald!')
      navigate('/')
    } catch (err) {
      toastError(err.message)
    }
  }

  const displayName = getDisplayName(user)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-900/8 bg-white/95 backdrop-blur-xl">
      <div className="container-x">
        <div className="flex h-16 items-center gap-3 lg:h-[72px]">
          <Logo compact />

          <div className="mx-auto hidden w-full max-w-xl lg:block">
            <SearchBar categories={categories} />
          </div>

          <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Hauptnavigation">
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setCategoryOpen((open) => !open)}
                aria-expanded={categoryOpen}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  categoryOpen ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
                }`}
              >
                Kategorien
                <ChevronDown className={`size-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 w-72 animate-pop-in rounded-2xl border border-brand-900/10 bg-white p-2 shadow-xl">
                  <p className="px-3 py-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                    Nach Kategorie stöbern
                  </p>
                  {categories.length ? (
                    <div className="max-h-72 overflow-y-auto">
                      {categories.slice(0, 12).map((category) => (
                        <Link
                          key={category.id ?? category.slug}
                          to={`/marktplatz?category=${encodeURIComponent(category.slug ?? category.id)}`}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
                        >
                          {category.name}
                          {category.count > 0 && <span className="text-xs text-slate-400">{category.count}</span>}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-3 text-sm text-slate-500">Kategorien werden geladen, sobald der Katalog erreichbar ist.</p>
                  )}
                  <Link
                    to="/marktplatz"
                    className="mt-1 block rounded-xl bg-brand-50 px-3 py-2 text-center text-sm font-bold text-brand-800 hover:bg-brand-100"
                  >
                    Alle Kategorien ansehen
                  </Link>
                </div>
              )}
            </div>
            {publicLinks.slice(1).map((link) => (
              <NavItem key={link.to} to={link.to}>
                {link.label}
              </NavItem>
            ))}

            <div className="mx-2 h-6 w-px bg-brand-900/10" />

            <IconLink to="/favoriten" label="Favoriten" icon={Heart} count={favoriteCount} />
            <IconLink to="/nachrichten" label="Nachrichten" icon={MessageCircle} />
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen((open) => !open)}
                  aria-label="Benachrichtigungen"
                  aria-expanded={notificationOpen}
                  className="relative grid size-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
                >
                  <Bell className="size-5" />
                  <CountBadge count={unreadCount} />
                </button>
                {notificationOpen && (
                  <div className="absolute top-full right-0 z-50 mt-2 w-80 animate-pop-in rounded-2xl border border-brand-900/10 bg-white p-2 shadow-xl">
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Benachrichtigungen</p>
                      {unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} className="text-xs font-bold text-brand-700 hover:underline">
                          Alle als gelesen markieren
                        </button>
                      )}
                    </div>
                    <NotificationList notifications={notifications} onRead={handleNotificationRead} />
                    <Link to="/dashboard" className="mt-1 block rounded-xl bg-brand-50 px-3 py-2 text-center text-sm font-bold text-brand-800 hover:bg-brand-100">
                      Zur Übersicht
                    </Link>
                  </div>
                )}
              </div>
            )}
            <IconLink to="/warenkorb" label="Warenkorb" icon={ShoppingCart} count={cartCount} />

            <div className="relative ml-1" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((open) => !open)}
                aria-label="Kontomenü"
                aria-expanded={userOpen}
                className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-800 transition-colors hover:bg-brand-100"
              >
                <UserRound className="size-5" />
              </button>
              {userOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-64 animate-pop-in rounded-2xl border border-brand-900/10 bg-white p-2 shadow-xl">
                  {isAuthenticated ? (
                    <>
                      <div className="border-b border-brand-900/8 px-3 py-3">
                        <p className="truncate text-sm font-extrabold text-brand-950">{displayName}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <MenuLink to="/dashboard" icon={LayoutDashboard}>Dashboard</MenuLink>
                      <MenuLink to="/profil" icon={UserRound}>Profil</MenuLink>
                      <MenuLink to="/bestellungen" icon={ShoppingBag}>Bestellungen</MenuLink>
                      {isAdmin && <MenuLink to="/admin" icon={Store}>Admin-Bereich</MenuLink>}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="size-4" /> Abmelden
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="px-3 py-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                        Willkommen bei SwapThrift
                      </p>
                      <MenuLink to="/login" icon={UserRound}>Anmelden</MenuLink>
                      <MenuLink to="/registrieren" icon={PlusCircle}>Kostenlos registrieren</MenuLink>
                      <Link to="/registrieren" className="btn-primary mt-2 w-full">
                        Jetzt starten
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={mobileOpen}
            className="ml-auto grid size-10 place-items-center rounded-xl text-brand-900 hover:bg-brand-50 lg:hidden"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="animate-slide-up border-t border-brand-900/8 py-4 lg:hidden">
            <SearchBar categories={categories} className="mb-4" />
            <nav className="grid gap-1" aria-label="Mobile Navigation">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-xl px-3 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-50"
                >
                  {link.label}
                </Link>
              ))}
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id ?? category.slug}
                  to={`/marktplatz?category=${encodeURIComponent(category.slug ?? category.id)}`}
                  className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-brand-50"
                >
                  {category.name}
                </Link>
              ))}
              <div className="my-2 divider" />
              <MobileIconLink to="/favoriten" icon={Heart} label="Favoriten" count={favoriteCount} />
              <MobileIconLink to="/nachrichten" icon={MessageCircle} label="Nachrichten" />
              <MobileIconLink to="/warenkorb" icon={ShoppingCart} label="Warenkorb" count={cartCount} />
              {isAuthenticated && (
                <div>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen((open) => !open)}
                    aria-expanded={notificationOpen}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-50"
                  >
                    <Bell className="size-5 text-brand-700" /> Benachrichtigungen
                    {unreadCount > 0 && <span className="ml-auto rounded-full bg-sand-200 px-2 text-xs">{unreadCount}</span>}
                  </button>
                  {notificationOpen && (
                    <div className="mx-3 mt-1 rounded-xl border border-brand-900/8 bg-white p-1">
                      <NotificationList notifications={notifications} onRead={handleNotificationRead} />
                      {unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} className="w-full rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800">
                          Alle als gelesen markieren
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="my-2 divider" />
              {isAuthenticated ? (
                <>
                  <MobileIconLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <MobileIconLink to="/profil" icon={UserRound} label="Profil" />
                  {isAdmin && <MobileIconLink to="/admin" icon={Store} label="Admin-Bereich" />}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="size-5" /> Abmelden
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-3 pt-1">
                  <Link to="/login" className="btn-outline">Anmelden</Link>
                  <Link to="/registrieren" className="btn-primary">Registrieren</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

function IconLink({ to, label, icon: Icon, count }) {
  return (
    <Link to={to} aria-label={label} title={label} className="relative grid size-10 place-items-center rounded-full text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800">
      <Icon className="size-5" />
      <CountBadge count={count} />
    </Link>
  )
}

function MobileIconLink({ to, icon: Icon, label, count }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-50">
      <Icon className="size-5 text-brand-700" />
      {label}
      {count > 0 && <span className="ml-auto rounded-full bg-sand-200 px-2 text-xs">{count}</span>}
    </Link>
  )
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-900">
      <Icon className="size-4" /> {children}
    </Link>
  )
}
