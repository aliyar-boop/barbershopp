import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Check, Clock3, Scissors, UserRound } from 'lucide-react'
import { useAuth } from '../../features/auth/authContext'
import { watchBarbers } from '../../features/barber/barberService'
import { createBooking, watchLocks } from '../../features/booking/bookingService'
import { watchServices } from '../../features/service/serviceService'
import { getTimeSlots, isPastSlot, todayString, getLockIds, isWorkingDay, toMinutes } from '../../utils/time'
import { getErrorMessage } from '../../utils/errors'
import Loading from '../../components/Loading'
import Notice from '../../components/Notice'

const steps = ['Кызмат', 'Барбер', 'Убакыт', 'Маалымат']
const dayLabels = ['Жекшемби', 'Дүйшөмбү', 'Шейшемби', 'Шаршемби', 'Бейшемби', 'Жума', 'Ишемби']

export default function BookingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [date, setDate] = useState(todayString())
  const [serviceId, setServiceId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [lockData, setLockData] = useState({ key: '', ids: new Set() })
  const [slotReload, setSlotReload] = useState(0)
  const [customerName, setCustomerName] = useState(profile?.name || user?.displayName || '')
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [slotError, setSlotError] = useState('')

  useEffect(() => {
    let receivedCatalogs = 0
    const handleCatalog = () => {
      receivedCatalogs += 1
      if (receivedCatalogs === 2) setLoading(false)
    }
    const handleError = (loadError) => {
      setError(getErrorMessage(loadError))
      setLoading(false)
    }
    const stopServices = watchServices((items) => {
      setServices(items)
      handleCatalog()
    }, handleError)
    const stopBarbers = watchBarbers((items) => {
      setBarbers(items)
      handleCatalog()
    }, handleError)
    return () => {
      stopServices()
      stopBarbers()
    }
  }, [])

  const service = services.find((item) => item.id === serviceId)
  const barber = barbers.find((item) => item.id === barberId)
  const slotQueryKey = `${barber?.id || ''}:${date}`
  const locks = lockData.key === slotQueryKey ? lockData.ids : new Set()
  const slotLoading = Boolean(barber && isWorkingDay(date, barber.workingDays) && lockData.key !== slotQueryKey)
  const allowedServices = useMemo(() => {
    if (!barber?.serviceIds?.length) return services
    return services.filter((item) => barber.serviceIds.includes(item.id))
  }, [barber, services])
  const serviceDuration = service?.durationMinutes ?? service?.duration ?? 30
  const slots = getTimeSlots(serviceDuration, barber ? toMinutes(barber.openTime || '10:00') : undefined, barber ? toMinutes(barber.closeTime || '20:00') : undefined)

  useEffect(() => {
    if (!barber || !date || !isWorkingDay(date, barber.workingDays)) return
    return watchLocks(barber.id, date, (ids) => {
      setLockData({ key: slotQueryKey, ids })
      setSlotError('')
    }, (loadError) => setSlotError(getErrorMessage(loadError)))
  }, [barber, date, slotQueryKey, slotReload])

  function isOccupied(slot) {
    return getLockIds(barberId, date, slot.startTime, serviceDuration).some((id) => locks.has(id))
  }

  async function submit(event) {
    event.preventDefault()
    if (!user || !profile || !barber || !service || !startTime) return
    setBusy(true)
    setError('')
    try {
      await createBooking({
        user, profile: { ...profile, name: customerName, phone: customerPhone },
        barber, service, date, startTime, customerName, customerPhone,
      })
      setSuccess(true)
      window.setTimeout(() => navigate('/account'), 1800)
    } catch (bookingError) {
      setError(getErrorMessage(bookingError))
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) return <main className="page-wrap"><Loading label="Аккаунт текшерилүүдө..." /></main>
  if (!user) return <main className="page-wrap booking-login"><div className="panel"><CalendarDays /><h1>Онлайн жазылуу</h1><p>Брондоо үчүн аккаунтуңузга кириңиз же катталыңыз.</p><div className="inline-actions"><Link className="button button-gold" to="/login?next=/booking">Кирүү</Link><Link className="button button-outline" to="/register?next=/booking">Катталуу</Link></div></div></main>
  if (loading) return <main className="page-wrap"><Loading label="Маалыматтар жүктөлүүдө..." /></main>
  if (profile?.role !== 'user') {
    const path = profile?.role === 'admin' ? '/admin' : '/barber'
    return <main className="page-wrap booking-login"><div className="panel"><CalendarDays /><h1>Кардарларга гана</h1><p>Онлайн брондоо кардар аккаунттары үчүн жеткиликтүү.</p><Link className="button button-outline" to={path}>Кабинетке кайтуу</Link></div></main>
  }

  const currentStep = !service ? 0 : !barber ? 1 : !startTime ? 2 : 3
  return (
    <main className="page-wrap booking-page">
      <div className="page-heading"><div className="section-kicker">GOLDEN CUT — ONLINE</div><h1>Жазылуу <em>брондоо</em></h1><p>Өзүңүзгө ыңгайлуу кызматты жана убакытты тандаңыз.</p></div>
      {success && <Notice type="success">Жазылууңуз ийгиликтүү жөнөтүлдү. Жеке кабинетиңизге өтүп жатасыз...</Notice>}
      <div className="stepper">{steps.map((label, index) => <div className={`step ${index <= currentStep ? 'step-active' : ''}`} key={label}><span>{index < currentStep ? <Check size={15} /> : index + 1}</span><b>{label}</b></div>)}</div>
      <Notice>{error || slotError}</Notice>
      {profile?.role !== 'user' && <Notice>Онлайн брондоо кардар аккаунттары үчүн жеткиликтүү.</Notice>}
      <div className="booking-layout">
        <section className="booking-form panel">
          <div className="form-section">
            <div className="form-section-title"><span>01</span><div><h2>Кызматты тандаңыз</h2><p>Сизге керектүү кызмат</p></div></div>
            {allowedServices.length ? <div className="choice-grid">{allowedServices.map((item) => (
              <button type="button" className={`choice-card ${serviceId === item.id ? 'choice-selected' : ''}`} key={item.id} onClick={() => { setServiceId(item.id); setStartTime('') }}>
                <span className="choice-icon"><Scissors size={19} /></span><span className="choice-main"><b>{item.name}</b><small><Clock3 size={13} /> {item.durationMinutes ?? item.duration} мүнөт</small></span><strong>{item.price == null || item.price === '' ? 'Баасы тактала элек' : `${item.price} сом`}</strong>
              </button>
            ))}</div> : <p className="muted-copy">Тандалган барбер бул кызматтарды көрсөтпөйт же кызматтар кошула элек.</p>}
          </div>
          <div className="form-section">
            <div className="form-section-title"><span>02</span><div><h2>Барберди тандаңыз</h2><p>Сизге кызмат көрсөтө турган адис</p></div></div>
            {barbers.length ? <div className="choice-grid barber-choices">{barbers.map((item) => (
              <button type="button" className={`choice-card ${barberId === item.id ? 'choice-selected' : ''} ${service && item.serviceIds?.length && !item.serviceIds.includes(service.id) ? 'choice-disabled' : ''}`} key={item.id} disabled={Boolean(service && item.serviceIds?.length && !item.serviceIds.includes(service.id))} onClick={() => { setBarberId(item.id); setStartTime(''); setServiceId((id) => item.serviceIds?.length && !item.serviceIds.includes(id) ? '' : id) }}>
                {item.photoUrl ? <img className="choice-avatar" src={item.photoUrl} alt="" /> : <span className="choice-avatar"><UserRound size={20} /></span>}
                <span className="choice-main"><b>{item.name}</b><small>10:00 — 20:00</small></span>
              </button>
            ))}</div> : <p className="muted-copy">Барберлер админ тарабынан кошула элек.</p>}
          </div>
          <div className="form-section">
            <div className="form-section-title"><span>03</span><div><h2>Күн жана убакыт</h2><p>{barber ? `Иштөө графиги: ${barber.openTime || '10:00'} — ${barber.closeTime || '20:00'} · ${(barber.workingDays || [1, 2, 3, 4, 5, 6]).map((day) => dayLabels[day]).join(', ')}` : 'Барберди тандап, анын иш күндөрүн көрүңүз.'}</p></div></div>
            <label className="field-label">Күнү<input className="input-control date-input" type="date" min={todayString()} value={date} onChange={(event) => { setDate(event.target.value); setStartTime('') }} /></label>
            {barber && !isWorkingDay(date, barber.workingDays) && <p className="day-closed">Тандалган күнү барбер эс алат. Башка күндү тандаңыз.</p>}
            {barber && isWorkingDay(date, barber.workingDays) && (slotLoading ? <><Loading label="Бош убакыттар текшерилүүдө..." />{slotError && <button className="button button-outline" onClick={() => setSlotReload((value) => value + 1)}>Кайра текшерүү</button>}</> : (
              <div className="time-grid">{slots.map((slot) => {
                const occupied = isOccupied(slot)
                const past = isPastSlot(date, slot.startTime)
                return <button type="button" key={slot.startTime} disabled={occupied || past} onClick={() => setStartTime(slot.startTime)} className={`time-slot ${occupied ? 'time-busy' : 'time-free'} ${past ? 'time-past' : ''} ${startTime === slot.startTime ? 'time-selected' : ''}`} title={occupied ? 'Бул убакыт брондолгон' : past ? 'Бул убакыт өтүп кеткен' : 'Бош убакыт'}>{slot.startTime}</button>
              })}</div>
            ))}
            <div className="slot-legend"><span><i className="legend-free" /> Бош убакыт</span><span><i className="legend-busy" /> Брондолгон</span></div>
          </div>
          <div className="form-section">
            <div className="form-section-title"><span>04</span><div><h2>Байланыш маалыматы</h2><p>Жазылууну ырастоо үчүн</p></div></div>
            <div className="form-row"><label className="field-label">Аты-жөнү<input className="input-control" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label><label className="field-label">Телефон<input className="input-control" type="tel" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label></div>
            <button type="button" className="button button-gold button-large full-width" disabled={busy || !service || !barber || !startTime || !customerName.trim() || !customerPhone.trim() || success} onClick={submit}>{busy ? 'Брондолууда...' : 'Жазылууну ырастоо'} <Check size={17} /></button>
            <p className="privacy-note">Ырастоо менен сиз жазылууңуздун шарттарына макул болосуз.</p>
          </div>
        </section>
        <aside className="booking-summary panel">
          <div className="section-kicker">СИЗДИН ЖАЗЫЛУУҢУЗ</div><h2>Кыскача маалымат</h2>
          <div className="summary-row"><span>Кызмат</span><b>{service?.name || 'Тандала элек'}</b></div>
          <div className="summary-row"><span>Барбер</span><b>{barber?.name || 'Тандала элек'}</b></div>
          <div className="summary-row"><span>Күнү</span><b>{date || 'Тандала элек'}</b></div>
          <div className="summary-row"><span>Убактысы</span><b>{startTime || 'Тандала элек'}</b></div>
          <div className="summary-total"><span>Жалпы баа</span><strong>{service?.price == null || service?.price === '' ? 'Тактала элек' : `${service.price} сом`}</strong></div>
          <p className="summary-hint"><Clock3 size={15} /> Кызмат аяктагандан кийинки убакыт автоматтык түрдө бош эмес болуп белгиленет.</p>
        </aside>
      </div>
    </main>
  )
}
