/* oxlint-disable react/only-export-components -- Diese Datei definiert nur den Router; Seiten werden lazy geladen. */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Loader from '../components/Loader'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import MainLayout from '../layouts/MainLayout'

const Home = lazy(() => import('../pages/Home'))
const Marketplace = lazy(() => import('../pages/Marketplace'))
const ProductDetails = lazy(() => import('../pages/ProductDetails'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const Legal = lazy(() => import('../pages/Legal'))
const CreateListing = lazy(() => import('../pages/CreateListing'))
const Favorites = lazy(() => import('../pages/Favorites'))
const Cart = lazy(() => import('../pages/Cart'))
const Checkout = lazy(() => import('../pages/Checkout'))
const Messages = lazy(() => import('../pages/Messages'))
const BuyerDashboard = lazy(() => import('../pages/BuyerDashboard'))
const Orders = lazy(() => import('../pages/Orders'))
const Profile = lazy(() => import('../pages/Profile'))
const SellerDashboard = lazy(() => import('../pages/SellerDashboard'))
const SellerProfile = lazy(() => import('../pages/SellerProfile'))
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'))
const NotFound = lazy(() => import('../pages/NotFound'))

function page(Component) {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: page(Home) },
      { path: '/marktplatz', element: page(Marketplace) },
      { path: '/produkt/:id', element: page(ProductDetails) },
      { path: '/login', element: page(Login) },
      { path: '/registrieren', element: page(Register) },
      { path: '/verify-email', element: page(VerifyEmail) },
      { path: '/forgot-password', element: page(ForgotPassword) },
      { path: '/reset-password', element: page(ResetPassword) },
      { path: '/rechtliches/:slug', element: page(Legal) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/verkaufen', element: page(CreateListing) },
          { path: '/favoriten', element: page(Favorites) },
          { path: '/warenkorb', element: page(Cart) },
          { path: '/checkout', element: page(Checkout) },
          { path: '/nachrichten', element: page(Messages) },
        ],
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: page(BuyerDashboard) },
      { path: '/bestellungen', element: page(Orders) },
      { path: '/profil', element: page(Profile) },
      { path: '/verkaeufer', element: page(SellerDashboard) },
      { path: '/verkaeufer/profil', element: page(SellerProfile) },
      {
        element: <ProtectedRoute roles={['admin']} />,
        children: [{ path: '/admin', element: page(AdminDashboard) }],
      },
    ],
  },
  { path: '*', element: page(NotFound) },
])

export default router
