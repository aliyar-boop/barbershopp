import { readLocalCatalog, saveLocalCatalog, subscribeLocalCatalog } from '../localAdmin/localCatalogService'
import { getLockIds, isPastSlot, isWorkingDay, toMinutes } from '../../utils/time'

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function activeBooking(booking) {
  return booking.status !== 'cancelled'
}

export function watchLocks(barberId, date, onChange, onError) {
  const update = () => {
    try {
      const { bookings } = readLocalCatalog()
      const ids = new Set(bookings
        .filter((booking) => booking.barberId === barberId && booking.date === date && activeBooking(booking))
        .flatMap((booking) => getLockIds(barberId, date, booking.startTime, booking.duration)))
      onChange(ids)
    } catch (error) {
      onError?.(error)
    }
  }
  update()
  return subscribeLocalCatalog(update)
}

export async function createBooking({ user, profile, barber, service, date, startTime, customerName, customerPhone }) {
  const catalog = readLocalCatalog()
  const duration = Number(service.durationMinutes ?? service.duration)
  const start = toMinutes(startTime)
  const opening = toMinutes(barber.openTime || '10:00')
  const closing = toMinutes(barber.closeTime || '20:00')
  if (!Number.isInteger(duration) || duration % 30 !== 0 || duration < 30) {
    throw new Error('Кызматтын узактыгы 30 мүнөттүн эселүү саны болушу керек.')
  }
  if (start < opening || start + duration > closing || (start - opening) % 30 !== 0) {
    throw new Error('Тандалган убакыт иш графигине туура келбейт.')
  }
  if (!isWorkingDay(date, barber.workingDays) || isPastSlot(date, startTime)) {
    throw new Error('Бул дата же убакытка жазылууга болбойт.')
  }
  const end = start + duration
  const overlaps = catalog.bookings.some((booking) => {
    if (booking.barberId !== barber.id || booking.date !== date || !activeBooking(booking)) return false
    const bookingStart = toMinutes(booking.startTime)
    const bookingEnd = toMinutes(booking.endTime)
    return start < bookingEnd && end > bookingStart
  })
  if (overlaps) throw new Error('Бул убакыт жаңы эле брондолду. Башка убакыт тандаңыз.')

  const id = createId()
  const name = customerName?.trim() || profile.name || user.displayName || ''
  const booking = {
    id,
    userId: user.uid,
    customerName: name,
    customerPhone: customerPhone?.trim() || profile.phone || '',
    barberId: barber.id,
    barberName: barber.name,
    barberAccountUid: barber.accountUid || '',
    serviceId: service.id,
    serviceName: service.name,
    duration,
    price: service.price == null || service.price === '' ? null : Number(service.price),
    date,
    startTime,
    endTime: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
    status: 'pending',
    lockIds: getLockIds(barber.id, date, startTime, duration),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  catalog.bookings.push(booking)
  catalog.notifications.push({
    id: createId(),
    recipientUid: barber.accountUid || '',
    recipientRole: barber.accountUid ? '' : 'admin',
    type: 'new_booking',
    bookingId: id,
    message: `${name} жаңы убакытка жазылды.`,
    read: false,
    createdAt: new Date().toISOString(),
  })
  saveLocalCatalog(catalog)
  return id
}

export async function cancelBooking(booking) {
  await updateBookingStatus(booking, 'cancelled')
}

export async function updateBookingStatus(booking, status) {
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) throw new Error('Жазылуунун статусу туура эмес.')
  const catalog = readLocalCatalog()
  const current = catalog.bookings.find((item) => item.id === booking.id)
  if (!current) throw new Error('Жазылуу табылган жок.')
  if (current.status === status) return
  if (current.status === 'cancelled' && status !== 'cancelled') {
    throw new Error('Жокко чыгарылган жазылууну кайра ачууга болбойт. Жаңы жазылуу түзүңүз.')
  }
  current.status = status
  current.updatedAt = new Date().toISOString()
  if (status !== 'pending') {
    catalog.notifications.push({
      id: createId(),
      recipientUid: current.userId,
      recipientRole: '',
      type: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
      bookingId: current.id,
      message: status === 'confirmed' ? 'Жазылууңуз ырасталды.' : 'Жазылууңуз жокко чыгарылды.',
      read: false,
      createdAt: new Date().toISOString(),
    })
  }
  saveLocalCatalog(catalog)
}

export async function listBookings({ role, uid, barberId, date, status, pageCursor } = {}) {
  const { bookings } = readLocalCatalog()
  const filtered = bookings
    .filter((booking) => role !== 'user' || booking.userId === uid)
    .filter((booking) => role !== 'barber' || booking.barberId === barberId)
    .filter((booking) => !date || booking.date === date)
    .filter((booking) => !barberId || booking.barberId === barberId)
    .filter((booking) => !status || booking.status === status)
    .sort((left, right) => right.date.localeCompare(left.date) || left.startTime.localeCompare(right.startTime))
  const offset = Number.isInteger(pageCursor) ? pageCursor : 0
  const items = filtered.slice(offset, offset + 10)
  return {
    items,
    cursor: offset + items.length,
    hasMore: offset + items.length < filtered.length,
  }
}

export function watchBookings(onChange, onError) {
  const update = () => {
    try {
      onChange(readLocalCatalog().bookings)
    } catch (error) {
      onError?.(error)
    }
  }
  update()
  return subscribeLocalCatalog(update)
}
