import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Clock3, Scissors, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import Notice from '../../components/Notice'
import { saveLocalCatalog, subscribeLocalCatalog } from '../../features/localAdmin/localCatalogService'
import { updateBookingStatus } from '../../features/booking/bookingService'

const PASSCODE_HASH = 'f4da079d0264f348fd517f7b260a68647c677c420c66e5cecf29ed2ba0e798b5'
const STORAGE_UNLOCK_KEY = 'golden-cut-local-admin-unlocked'
const DAYS = ['Жекшемби', 'Дүйшөмбү', 'Шейшемби', 'Шаршемби', 'Бейшемби', 'Жума', 'Ишемби']
const initialService = { name: '', description: '', durationMinutes: 30, price: '', active: true }
const initialBarber = {
  name: '', bio: '', photoUrl: '', skills: [], workingDays: [1, 2, 3, 4, 5, 6],
  openTime: '10:00', closeTime: '20:00', active: true,
}

async function matchesPasscode(value) {
  if (!globalThis.crypto?.subtle) throw new Error('Бул браузерде коопсуз текшерүү жеткиликтүү эмес. HTTPS аркылуу ачыңыз.')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return hash === PASSCODE_HASH
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function passcodeInitiallyUnlocked() {
  try {
    return window.sessionStorage.getItem(STORAGE_UNLOCK_KEY) === 'true'
  } catch {
    return false
  }
}

export default function LocalAdminPage() {
  const [unlocked, setUnlocked] = useState(passcodeInitiallyUnlocked)
  const [passcode, setPasscode] = useState('')
  const [catalog, setCatalog] = useState({ services: [], barbers: [], bookings: [], notifications: [] })
  const [editingServiceId, setEditingServiceId] = useState('')
  const [editingBarberId, setEditingBarberId] = useState('')
  const [serviceForm, setServiceForm] = useState(initialService)
  const [barberForm, setBarberForm] = useState(initialBarber)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => subscribeLocalCatalog((storedCatalog) => {
    if (storedCatalog) setCatalog(storedCatalog)
  }, (loadError) => setError(loadError.message)), [])

  async function unlock(event) {
    event.preventDefault()
    setError('')
    try {
      if (!await matchesPasscode(passcode)) {
        setError('Кирүү сөзү туура эмес.')
        return
      }
      window.sessionStorage.setItem(STORAGE_UNLOCK_KEY, 'true')
      setPasscode('')
      setUnlocked(true)
    } catch (unlockError) {
      setError(unlockError.message)
    }
  }

  function lock() {
    window.sessionStorage.removeItem(STORAGE_UNLOCK_KEY)
    setUnlocked(false)
  }

  function persistCatalog(nextCatalog, successMessage) {
    try {
      saveLocalCatalog(nextCatalog)
      setCatalog(nextCatalog)
      setError('')
      setMessage(successMessage)
      return true
    } catch (saveError) {
      setError(`Сактоо ишке ашкан жок: ${saveError.message}`)
      return false
    }
  }

  function submitService(event) {
    event.preventDefault()
    const name = serviceForm.name.trim()
    const durationMinutes = Number(serviceForm.durationMinutes)
    const price = Number(serviceForm.price)
    if (!name || !Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240 || durationMinutes % 30) {
      setError('Кызматтын атын жана 30–240 мүнөттүн ичиндеги туура узактыгын киргизиңиз.')
      return
    }
    if (serviceForm.price === '' || !Number.isFinite(price) || price < 0) {
      setError('Кызматтын баасын киргизиңиз.')
      return
    }
    const item = { ...serviceForm, id: editingServiceId || createId(), name, description: serviceForm.description.trim(), durationMinutes, price }
    const services = editingServiceId
      ? catalog.services.map((service) => service.id === editingServiceId ? item : service)
      : [...catalog.services, item]
    if (!persistCatalog({ ...catalog, services }, editingServiceId ? 'Кызмат жаңыртылды.' : 'Кызмат кошулду.')) return
    setServiceForm(initialService)
    setEditingServiceId('')
  }

  function editService(service) {
    setEditingServiceId(service.id)
    setServiceForm({ ...initialService, ...service, price: service.price == null ? '' : String(service.price) })
    setMessage('')
  }

  function submitBarber(event) {
    event.preventDefault()
    const name = barberForm.name.trim()
    const bio = barberForm.bio.trim()
    const skills = barberForm.skillsText.split(',').map((skill) => skill.trim()).filter(Boolean)
    if (!name) {
      setError('Барбердин аты-жөнүн киргизиңиз.')
      return
    }
    if (barberForm.openTime >= barberForm.closeTime) {
      setError('Жабылуу убактысы ачылуу убактысынан кийин болушу керек.')
      return
    }
    const item = {
      ...barberForm,
      id: editingBarberId || createId(),
      name,
      bio,
      photoUrl: barberForm.photoUrl.trim(),
      skills,
    }
    delete item.skillsText
    const barbers = editingBarberId
      ? catalog.barbers.map((barber) => barber.id === editingBarberId ? item : barber)
      : [...catalog.barbers, item]
    if (!persistCatalog({ ...catalog, barbers }, editingBarberId ? 'Барбердин профили жаңыртылды.' : 'Барбер кошулду.')) return
    setBarberForm(initialBarber)
    setEditingBarberId('')
  }

  function editBarber(barber) {
    setEditingBarberId(barber.id)
    setBarberForm({ ...initialBarber, ...barber, skillsText: (barber.skills || []).join(', ') })
    setMessage('')
  }

  function toggleWorkingDay(day) {
    setBarberForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }))
  }

  function deleteItem(type, item) {
    if (!window.confirm(`"${item.name}" өчүрүлсүнбү?`)) return
    const nextCatalog = { ...catalog, [type]: catalog[type].filter((entry) => entry.id !== item.id) }
    if (!persistCatalog(nextCatalog, type === 'services' ? 'Кызмат өчүрүлдү.' : 'Барбер өчүрүлдү.')) return
    if (type === 'services' && editingServiceId === item.id) {
      setEditingServiceId('')
      setServiceForm(initialService)
    }
    if (type === 'barbers' && editingBarberId === item.id) {
      setEditingBarberId('')
      setBarberForm(initialBarber)
    }
  }

  async function changeBookingStatus(booking, status) {
    try {
      await updateBookingStatus(booking, status)
      setError('')
      setMessage('Статус жаңыртылды.')
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  function deleteBooking(booking) {
    if (!window.confirm(`${booking.customerName} кардарынын жазылуусун өчүрөсүзбү?`)) return
    const nextCatalog = {
      ...catalog,
      bookings: catalog.bookings.filter((item) => item.id !== booking.id),
      notifications: catalog.notifications.filter((item) => item.bookingId !== booking.id),
    }
    persistCatalog(nextCatalog, 'Жазылуу өчүрүлдү.')
  }

  if (!unlocked) {
    return (
      <main className="page-wrap admin-page local-admin-login">
        <section className="panel local-admin-login-card">
          <div className="auth-emblem"><Scissors size={22} /></div>
          <div className="section-kicker">GOLDEN CUT — LOCAL ADMIN</div>
          <h1>Админ <em>панель</em></h1>
          <p className="muted-copy">Панелди ачуу үчүн кирүү сөзүн жазыңыз.</p>
          <Notice>{error}</Notice>
          <form className="form-stack" onSubmit={unlock}>
            <label>Кирүү сөзү<input className="input-control" type="password" autoComplete="current-password" value={passcode} onChange={(event) => setPasscode(event.target.value)} required /></label>
            <button className="button button-gold button-large full-width" type="submit"><ShieldCheck size={16} /> Кирүү</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap admin-page">
      <div className="page-heading">
        <div className="section-kicker">GOLDEN CUT — LOCAL MANAGEMENT</div>
        <h1>Админ <em>панель</em></h1>
        <p>Кызматтарды, барберлерди, иш графигин жана кардарлардын жазылууларын ушул түзмөктө башкаруу.</p>
        <button className="button button-outline button-small" onClick={lock}>Панелди жабуу</button>
      </div>
      <Notice>{error}</Notice>
      <Notice type="success">{message}</Notice>
      <Notice>
        Демонстрациянын бардык маалыматы браузердин localStorage’ында сакталат. Админ сөзү сервердик коопсуздук эмес.
      </Notice>

      <section className="local-admin-section">
        <div className="section-heading"><div><div className="section-kicker">КЫЗМАТТАР</div><h2>Кызматтарды <em>башкаруу</em></h2></div></div>
        <div className="admin-grid">
          <form className="panel form-stack local-admin-form" onSubmit={submitService}>
            <h2>{editingServiceId ? 'Кызматты өзгөртүү' : 'Жаңы кызмат'}</h2>
            <label>Аталышы<input className="input-control" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required /></label>
            <label>Түшүндүрмө<textarea className="input-control" rows="3" maxLength="500" value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} /></label>
            <label>Узактыгы<select className="input-control" value={serviceForm.durationMinutes} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: Number(event.target.value) })}>{[30, 60, 90, 120, 150, 180, 210, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes} мүнөт</option>)}</select></label>
            <label>Баасы (сом)<input className="input-control" type="number" min="0" step="1" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} required /></label>
            <label className="check-label"><input type="checkbox" checked={serviceForm.active} onChange={(event) => setServiceForm({ ...serviceForm, active: event.target.checked })} /> Кардарларга көрсөтүү</label>
            <div className="inline-actions"><button className="button button-gold" type="submit">{editingServiceId ? 'Сактоо' : 'Кызмат кошуу'}</button>{editingServiceId && <button className="button button-outline" type="button" onClick={() => { setEditingServiceId(''); setServiceForm(initialService) }}>Жокко чыгаруу</button>}</div>
          </form>
          <section className="panel admin-panel"><h2>Кызматтар</h2>{catalog.services.length ? <div className="manage-list">{catalog.services.map((service) => <div className="manage-row" key={service.id}><div><b>{service.name}</b><small>{service.durationMinutes} мүнөт · {service.price == null || service.price === '' ? 'Баасы тактала элек' : `${service.price} сом`} · {service.active ? 'Активдүү' : 'Жашыруун'}</small></div><div className="inline-actions"><button className="button button-outline button-small" onClick={() => editService(service)}>Өзгөртүү</button><button className="button button-danger button-small" onClick={() => deleteItem('services', service)} aria-label={`${service.name} кызматын өчүрүү`}><Trash2 size={14} /></button></div></div>)}</div> : <EmptyState>Жергиликтүү кызматтар азырынча кошула элек.</EmptyState>}</section>
        </div>
      </section>

      <section className="local-admin-section">
        <div className="section-heading"><div><div className="section-kicker">КАРДАРЛАР</div><h2>Жазылууларды <em>башкаруу</em></h2></div></div>
        <section className="panel admin-panel">
          <h2>Бардык жазылуулар ({catalog.bookings.length})</h2>
          {catalog.bookings.length ? <div className="manage-list">{[...catalog.bookings].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((booking) => (
            <div className="manage-row" key={booking.id}>
              <div><b>{booking.customerName} · {booking.serviceName}</b><small>{booking.date} · {booking.startTime}–{booking.endTime} · {booking.customerPhone} · {booking.price == null ? 'Баасы тактала элек' : `${booking.price} сом`} · {booking.status === 'confirmed' ? 'Ырасталды' : booking.status === 'cancelled' ? 'Жокко чыгарылды' : 'Күтүүдө'}</small></div>
              <div className="inline-actions">{booking.status === 'pending' && <button className="button button-gold button-small" onClick={() => changeBookingStatus(booking, 'confirmed')}>Ырастоо</button>}{booking.status !== 'cancelled' && <button className="button button-outline button-small" onClick={() => changeBookingStatus(booking, 'cancelled')}>Жокко чыгаруу</button>}<button className="button button-danger button-small" onClick={() => deleteBooking(booking)} aria-label="Жазылууну өчүрүү"><Trash2 size={14} /></button></div>
            </div>
          ))}</div> : <EmptyState>Жазылуулар азырынча жок.</EmptyState>}
        </section>
      </section>

      <section className="local-admin-section">
        <div className="section-heading"><div><div className="section-kicker">КОМАНДА ЖАНА ГРАФИК</div><h2>Барберлерди <em>башкаруу</em></h2></div></div>
        <div className="admin-grid">
          <form className="panel form-stack local-admin-form" onSubmit={submitBarber}>
            <h2>{editingBarberId ? 'Барберди өзгөртүү' : 'Жаңы барбер'}</h2>
            <label>Аты-жөнү<input className="input-control" value={barberForm.name} onChange={(event) => setBarberForm({ ...barberForm, name: event.target.value })} required /></label>
            <label>Кесиптик маалымат<textarea className="input-control" rows="3" maxLength="500" value={barberForm.bio} onChange={(event) => setBarberForm({ ...barberForm, bio: event.target.value })} /></label>
            <label>Сүрөт URL<input className="input-control" type="url" value={barberForm.photoUrl} onChange={(event) => setBarberForm({ ...barberForm, photoUrl: event.target.value })} placeholder="https://..." /></label>
            <label>Көндүмдөр (үтүр менен бөлүңүз)<input className="input-control" value={barberForm.skillsText || ''} onChange={(event) => setBarberForm({ ...barberForm, skillsText: event.target.value })} placeholder="Fade, классикалык стрижка, сакал" /></label>
            <fieldset className="form-fieldset"><legend>Иш күндөрү</legend><div className="checkbox-grid">{DAYS.map((day, index) => <label className="check-label" key={day}><input type="checkbox" checked={barberForm.workingDays.includes(index)} onChange={() => toggleWorkingDay(index)} />{day}</label>)}</div></fieldset>
            <div className="form-row local-hours"><label>Ачылуу<input className="input-control" type="time" step="1800" value={barberForm.openTime} onChange={(event) => setBarberForm({ ...barberForm, openTime: event.target.value })} required /></label><label>Жабылуу<input className="input-control" type="time" step="1800" value={barberForm.closeTime} onChange={(event) => setBarberForm({ ...barberForm, closeTime: event.target.value })} required /></label></div>
            <label className="check-label"><input type="checkbox" checked={barberForm.active} onChange={(event) => setBarberForm({ ...barberForm, active: event.target.checked })} /> Активдүү</label>
            <div className="inline-actions"><button className="button button-gold" type="submit">{editingBarberId ? 'Сактоо' : 'Барбер кошуу'}</button>{editingBarberId && <button className="button button-outline" type="button" onClick={() => { setEditingBarberId(''); setBarberForm(initialBarber) }}>Жокко чыгаруу</button>}</div>
          </form>
          <section className="panel admin-panel"><h2>Барберлер</h2>{catalog.barbers.length ? <div className="manage-list">{catalog.barbers.map((barber) => <div className="manage-row" key={barber.id}><div><b>{barber.name}</b><small>{(barber.skills || []).join(', ') || 'Көндүмдөр көрсөтүлгөн эмес'} · {barber.openTime}–{barber.closeTime} · {barber.active ? 'Активдүү' : 'Жашыруун'}</small></div><div className="inline-actions"><button className="button button-outline button-small" onClick={() => editBarber(barber)}>Өзгөртүү</button><button className="button button-danger button-small" onClick={() => deleteItem('barbers', barber)} aria-label={`${barber.name} барберин өчүрүү`}><Trash2 size={14} /></button></div></div>)}</div> : <EmptyState>Жергиликтүү барберлер азырынча кошула элек.</EmptyState>}</section>
        </div>
      </section>

      <section className="panel local-admin-footer"><Clock3 size={17} /><span>Бул локалдык каталог браузерде гана иштейт. <Link to="/#services">Сайтка кайтуу <ArrowRight size={14} /></Link></span><CalendarDays size={17} /></section>
    </main>
  )
}
