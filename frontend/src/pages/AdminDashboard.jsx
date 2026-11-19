import { CheckCircle2, Flag, Package, RefreshCw, Search, ShieldCheck, Store, Users, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { useToast } from '../context/ToastContext'
import useApi, { useDebouncedValue } from '../hooks/useApi'
import adminService from '../services/admin'
import { normaliseProduct } from '../services/products'
import { apiErrorMessage } from '../utils/apiError'
import { getId, personLabel } from '../utils/entities'
import { formatDate, formatEUR, getImageUrl } from '../utils/format'

const REPORT_STATUSES = [
  { value: 'all', label: 'Alle Meldungen' },
  { value: 'pending', label: 'Offen' },
  { value: 'resolved', label: 'Erledigt' },
  { value: 'dismissed', label: 'Abgewiesen' },
]

const PRODUCT_STATUSES = [
  { value: 'all', label: 'Alle Inserate' },
  { value: 'active', label: 'Freigegeben' },
  { value: 'pending', label: 'In Prüfung' },
  { value: 'rejected', label: 'Abgelehnt' },
]

function statValue(value) {
  if (value === undefined || value === null || value === '') return '–'
  const number = Number(value)
  return Number.isFinite(number) ? number : '–'
}

function ListError({ message, onRetry }) {
  return (
    <div role="alert" className="card p-6">
      <p className="font-bold text-red-700">{message}</p>
      <button type="button" onClick={onRetry} className="btn-outline mt-4"><RefreshCw className="size-4" /> Erneut versuchen</button>
    </div>
  )
}

export default function AdminDashboard() {
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState('reports')
  const [reportStatus, setReportStatus] = useState('all')
  const [productStatus, setProductStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [resolutions, setResolutions] = useState({})
  const [busyId, setBusyId] = useState('')

  const searchTerm = useDebouncedValue(search.trim(), 350)

  const overview = useApi(() => adminService.overview(), [])
  const reports = useApi(() => adminService.reports(reportStatus), [reportStatus], { immediate: tab === 'reports' })
  const products = useApi(() => adminService.products(productStatus), [productStatus], { immediate: tab === 'products' })
  const users = useApi(() => adminService.users({ search: searchTerm, page: 1, limit: 20 }), [searchTerm], {
    immediate: tab === 'users',
  })

  async function runAction(id, action, message) {
    if (busyId) return
    setBusyId(id)
    try {
      await action()
      success(message)
      overview.refetch()
      reports.refetch()
      products.refetch()
      users.refetch()
    } catch (error) {
      toastError(apiErrorMessage(error))
    } finally {
      setBusyId('')
    }
  }

  const stats = overview.data?.stats ?? {}
  const statCards = [
    { label: 'Nutzer:innen', value: stats.users },
    { label: 'Inserate', value: stats.products },
    { label: 'Aktive Inserate', value: stats.activeProducts },
    { label: 'Bestellungen', value: stats.orders },
    { label: 'Offene Meldungen', value: stats.openReports },
    { label: 'Bewertungen', value: stats.reviews },
  ]

  return (
    <div className="container-x py-10">
      <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Verwaltung</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Admin-Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">Moderation und Kennzahlen der Plattform – ausschließlich mit echten Daten.</p>

      {overview.loading ? (
        <div className="mt-8"><Loader label="Übersicht wird geladen …" /></div>
      ) : overview.error ? (
        <div className="mt-8"><ListError message={apiErrorMessage(overview.error)} onRetry={overview.refetch} /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map(({ label, value }) => (
            <div key={label} className="card p-5">
              <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-800">{statValue(value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 inline-flex flex-wrap gap-1 rounded-xl border border-brand-900/10 bg-white p-1" role="tablist" aria-label="Verwaltungsbereiche">
        {[
          { value: 'reports', label: 'Meldungen', icon: Flag },
          { value: 'products', label: 'Inserate', icon: Store },
          { value: 'users', label: 'Nutzer:innen', icon: Users },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tab === value ? 'bg-brand-800 text-white' : 'text-slate-600 hover:bg-brand-50'}`}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'reports' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="label mb-0" htmlFor="report-status">Status</label>
              <select id="report-status" className="input w-auto" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}>
                {REPORT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            {reports.loading ? (
              <Loader label="Meldungen werden geladen …" />
            ) : reports.error ? (
              <ListError message={apiErrorMessage(reports.error)} onRetry={reports.refetch} />
            ) : reports.data?.length === 0 ? (
              <EmptyState icon={Flag} title="Keine Meldungen" description="Für diesen Filter liegen keine Meldungen vor." />
            ) : (
              <ul className="space-y-4">
                {(reports.data ?? []).map((report) => {
                  const id = getId(report)
                  const product = normaliseProduct(report.product)
                  return (
                    <li key={id} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-brand-950">{String(report.reason ?? report.category ?? 'Meldung').replace(/_/g, ' ')}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Gemeldet von {personLabel(report.reporter ?? report.reportedBy)}
                            {report.createdAt ? ` · ${formatDate(report.createdAt)}` : ''}
                          </p>
                        </div>
                        <span className="badge bg-sand-100 text-sand-800">{report.status ?? 'offen'}</span>
                      </div>
                      {report.description && <p className="mt-3 text-sm text-slate-600">{report.description}</p>}
                      {product?.id && (
                        <p className="mt-2 text-xs text-slate-600">Inserat: <Link className="link-brand" to={`/produkt/${encodeURIComponent(product.id)}`}>{product.title}</Link></p>
                      )}
                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-[16rem] flex-1">
                          <label className="label text-xs" htmlFor={`resolution-${id}`}>Auflösung / Hinweis</label>
                          <input
                            id={`resolution-${id}`}
                            className="input py-2 text-xs"
                            placeholder="Begründung für die Entscheidung"
                            value={resolutions[id] ?? ''}
                            onChange={(event) => setResolutions((current) => ({ ...current, [id]: event.target.value }))}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => runAction(id, () => adminService.resolveReport(id, { status: 'resolved', resolution: resolutions[id] ?? '' }), 'Die Meldung wurde als erledigt markiert.')}
                          className="btn-primary px-3 py-2 text-xs"
                        >
                          <CheckCircle2 className="size-4" /> Erledigt
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => runAction(id, () => adminService.resolveReport(id, { status: 'dismissed', resolution: resolutions[id] ?? '' }), 'Die Meldung wurde abgewiesen.')}
                          className="btn-outline px-3 py-2 text-xs"
                        >
                          <XCircle className="size-4" /> Abweisen
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {tab === 'products' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="label mb-0" htmlFor="product-status">Status</label>
              <select id="product-status" className="input w-auto" value={productStatus} onChange={(event) => setProductStatus(event.target.value)}>
                {PRODUCT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            {products.loading ? (
              <Loader label="Inserate werden geladen …" />
            ) : products.error ? (
              <ListError message={apiErrorMessage(products.error)} onRetry={products.refetch} />
            ) : products.data?.length === 0 ? (
              <EmptyState icon={Package} title="Keine Inserate" description="Für diesen Filter sind keine Inserate vorhanden." />
            ) : (
              <ul className="space-y-4">
                {(products.data ?? []).map((entry) => {
                  const product = normaliseProduct(entry) ?? { id: getId(entry) }
                  const image = getImageUrl(product.images?.[0])
                  const statusLabel = product.status ?? (product.isActive === false ? 'inaktiv' : 'aktiv')
                  return (
                    <li key={product.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                        {image ? <img src={image} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-brand-700"><Package className="size-6" /></span>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-brand-950">{product.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {personLabel(product.seller)} · {product.price ? formatEUR(product.price) : 'Preis nicht angegeben'}
                        </p>
                        <span className="badge mt-2 bg-sand-100 text-sand-800">{statusLabel}</span>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => runAction(product.id, () => adminService.setProductStatus(product.id, 'active'), 'Das Inserat wurde freigegeben.')}
                          className="btn-primary px-3 py-2 text-xs"
                        >
                          <CheckCircle2 className="size-4" /> Freigeben
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => runAction(product.id, () => adminService.setProductStatus(product.id, 'rejected'), 'Das Inserat wurde abgelehnt.')}
                          className="btn-outline px-3 py-2 text-xs"
                        >
                          <XCircle className="size-4" /> Ablehnen
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="label mb-0" htmlFor="user-search">Suche</label>
              <div className="relative w-full max-w-sm">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="user-search"
                  className="input pl-9"
                  placeholder="Name oder E-Mail suchen"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            {users.loading ? (
              <Loader label="Nutzer:innen werden geladen …" />
            ) : users.error ? (
              <ListError message={apiErrorMessage(users.error)} onRetry={users.refetch} />
            ) : users.data?.users?.length === 0 ? (
              <EmptyState icon={Users} title="Keine Nutzer:innen gefunden" description="Passe die Suche an, um andere Konten zu finden." />
            ) : (
              <ul className="space-y-4">
                {(users.data?.users ?? []).map((user) => {
                  const id = getId(user)
                  const suspended = Boolean(user.isSuspended)
                  return (
                    <li key={id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold text-brand-950">{personLabel(user)}</p>
                        <p className="truncate text-xs text-slate-500">{user.email || 'Keine E-Mail angegeben'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : []).map((role) => (
                            <span key={String(role)} className="badge bg-brand-50 text-brand-800">{String(role)}</span>
                          ))}
                          <span className={`badge ${suspended || user.isActive === false ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800'}`}>
                            {suspended || user.isActive === false ? 'Gesperrt' : 'Aktiv'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => {
                          const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : []
                          runAction(
                            id,
                            () => adminService.setUserStatus(id, { isActive: suspended, isSuspended: !suspended, roles }),
                            suspended ? 'Das Konto wurde reaktiviert.' : 'Das Konto wurde gesperrt.',
                          )
                        }}
                        className={suspended ? 'btn-primary px-3 py-2 text-xs' : 'btn-outline px-3 py-2 text-xs'}
                      >
                        <ShieldCheck className="size-4" /> {suspended ? 'Aktivieren' : 'Sperren'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
