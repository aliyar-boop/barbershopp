import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, Menu, Scissors, UserRound, X } from 'lucide-react'
import { useAuth } from '../features/auth/authContext'
import { logout } from '../features/auth/authService'
import Notice from './Notice'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const accountPath = profile?.role === 'admin' ? '/admin' : profile?.role === 'barber' ? '/barber' : '/account'

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
      setMenuOpen(false)
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="nav-shell">
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark"><Scissors size={21} /></span>
            <span>GOLDEN<span className="brand-sub">CUT · BARBERSHOP</span></span>
          </Link>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
            <a href="/#about" onClick={() => setMenuOpen(false)}>Биз жөнүндө</a>
            <a href="/#services" onClick={() => setMenuOpen(false)}>Кызматтар</a>
            <a href="/#barbers" onClick={() => setMenuOpen(false)}>Барберлер</a>
            <a href="/#contact" onClick={() => setMenuOpen(false)}>Байланыш</a>
            {user ? (
              <>
                <NotificationBell />
                <NavLink to={accountPath} onClick={() => setMenuOpen(false)}><UserRound size={16} /> Кабинет</NavLink>
                <button className="button button-outline nav-action" onClick={handleLogout}>Чыгуу</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>Кирүү</NavLink>
                <Link className="button button-gold nav-action" to="/booking" onClick={() => setMenuOpen(false)}>
                  <CalendarDays size={16} /> Жазылуу
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="nav-error"><Notice>{error}</Notice></div>
    </>
  )
}
