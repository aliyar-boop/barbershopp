import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Loading from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './features/auth/AuthProvider'

const LocalAdminPage = lazy(() => import('./pages/Admin/LocalAdminPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const BookingPage = lazy(() => import('./pages/Booking/BookingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const BarberDashboardPage = lazy(() => import('./pages/Barber/BarberDashboardPage'))
const HomePage = lazy(() => import('./pages/HomePage'))

function ApplicationRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<Loading label="Барак жүктөлүүдө..." />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/account" element={<ProtectedRoute roles={['user']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/barber" element={<ProtectedRoute roles={['barber']}><BarberDashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<LocalAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default function App() {
  return <AuthProvider><ApplicationRoutes /></AuthProvider>
}
