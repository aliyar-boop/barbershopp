import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/authContext'
import Loading from './Loading'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading, error } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <main className="page-wrap"><div className="panel"><h2>Профиль табылган жок</h2><p>{error || 'Колдонуучунун демо маалыматы жүктөлгөн жок. Кайра кирип көрүңүз.'}</p></div></main>
  if (roles && !roles.includes(profile.role)) {
    const destination = profile.role === 'admin' ? '/admin' : profile.role === 'barber' ? '/barber' : '/account'
    return <Navigate to={destination} replace />
  }
  return children
}
