import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, RefreshCw, Scissors, UserRound } from 'lucide-react'
import { useAuth } from '../features/auth/authContext'
import { getBarberForAccount } from '../features/barber/barberService'
import { cancelBooking, listBookings } from '../features/booking/bookingService'
import { getErrorMessage } from '../utils/errors'
import BookingList from '../components/BookingList'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import Notice from '../components/Notice'

export default function DashboardPage({ role = 'user' }) {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [barber, setBarber] = useState(null)
  const [barberLoading, setBarberLoading] = useState(role === 'barber')
  const cursorRef = useRef(null)
  const [hasMore, setHasMore] = useState(false)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (role !== 'barber') return
    getBarberForAccount(user.uid).then((nextBarber) => {
      setBarber(nextBarber)
      if (!nextBarber) setLoading(false)
    }).catch((loadError) => {
      setError(getErrorMessage(loadError))
      setLoading(false)
    })
      .finally(() => setBarberLoading(false))
  }, [role, user.uid])

  const load = useCallback(async (append = false) => {
    if (role === 'barber' && barberLoading) return
    if (role === 'barber' && !barber) return
    try {
      const result = await listBookings({
        role, uid: user.uid, barberId: role === 'barber' ? barber.id : undefined,
        date: date || undefined, pageCursor: append ? cursorRef.current : null,
      })
      setError('')
      setItems((current) => append ? [...current, ...result.items] : result.items)
      cursorRef.current = result.cursor
      setHasMore(result.hasMore)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [barber, barberLoading, date, role, user.uid])

  useEffect(() => { load(false) }, [load])

  async function cancel(booking) {
    if (!window.confirm(`${booking.date} күнүндөгү ${booking.startTime} жазылуусун жокко чыгарасызбы?`)) return
    setBusyId(booking.id)
    setError('')
    try {
      await cancelBooking(booking)
      setMessage('Жазылуу жокко чыгарылды.')
      await load(false)
    } catch (cancelError) {
      setError(getErrorMessage(cancelError))
    } finally {
      setBusyId('')
    }
  }

  const title = role === 'barber' ? 'Барбер кабинети' : 'Менин жазылууларым'
  return (
    <main className="page-wrap dashboard-page">
      <div className="page-heading"><div className="section-kicker">{role === 'barber' ? 'BARBER DASHBOARD' : 'ЖЕКЕ КАБИНЕТ'}</div><h1>{title}</h1><p>Кош келиңиз, <b>{profile?.name || user.displayName}</b></p></div>
      <Notice>{error}</Notice><Notice type="success">{message}</Notice>
      {role === 'user' && <div className="dashboard-actions"><Link className="button button-gold" to="/booking"><CalendarDays size={16} /> Жаңы жазылуу</Link><span><UserRound size={15} /> {profile?.phone}</span></div>}
      <section className="panel dashboard-panel">
        <div className="list-toolbar"><div><h2><Scissors size={19} /> {role === 'barber' ? 'Менин кардарларым' : 'Жазылуулар'}</h2><p>{role === 'barber' ? 'Сизге дайындалган жазылуулар гана' : 'Акыркы жана алдыдагы жазылууларыңыз'}</p></div><div className="filter-control"><label htmlFor="booking-date-filter">Дата боюнча</label><input id="booking-date-filter" type="date" value={date} onChange={(event) => { setDate(event.target.value); setLoading(true) }} /><button className="icon-button" onClick={() => { setDate(''); setMessage(''); setLoading(true) }} aria-label="Фильтрди тазалоо"><RefreshCw size={17} /></button></div></div>
        {role === 'barber' && barberLoading && <Loading label="Барбер профили жүктөлүүдө..." />}
        {role === 'barber' && !barber && !loading && !barberLoading && <EmptyState>Бул аккаунтка барбер профили байланыштырылган эмес. Админден профилди текшерүүнү сураныңыз.</EmptyState>}
        {loading && !items.length ? <Loading label="Жазылуулар жүктөлүүдө..." /> : <BookingList bookings={items} onCancel={role === 'user' ? cancel : undefined} busyId={busyId} />}
        {hasMore && <button className="button button-outline load-more" disabled={loading} onClick={() => { setLoading(true); load(true) }}>{loading ? 'Жүктөлүүдө...' : 'Дагы көрсөтүү'}</button>}
        {!items.length && !loading && role === 'user' && <EmptyState>Сизде азырынча жазылуу жок. Биринчи жазылууңузду азыр жасаңыз.</EmptyState>}
      </section>
    </main>
  )
}
