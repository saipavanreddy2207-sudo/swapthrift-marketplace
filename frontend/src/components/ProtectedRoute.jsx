import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'
import EmptyState from './EmptyState'

export default function ProtectedRoute({ children, roles }) {
  // Pathless route guards rely on Outlet; explicit children keep the dashboard layout case working.
  const { isAuthenticated, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <Loader fullPage label="Sitzung wird geprüft …" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (roles?.length) {
    const allowed = roles.map((role) => String(role).toLowerCase())
    const hasAccess = allowed.includes('admin') ? isAdmin : true
    if (!hasAccess) {
      return (
        <div className="container-x py-16">
          <EmptyState
            title="Kein Zugriff auf diesen Bereich"
            description="Für diese Seite werden zusätzliche Berechtigungen benötigt. Wende dich bei Fragen an unser Support-Team."
            to="/dashboard"
            actionLabel="Zurück zum Dashboard"
          />
        </div>
      )
    }
  }

  return children ?? <Outlet />
}
