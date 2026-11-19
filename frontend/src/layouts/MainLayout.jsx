import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import ScrollToTop from '../components/ScrollToTop'
import Toast from '../components/Toast'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}
