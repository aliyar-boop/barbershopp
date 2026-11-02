import { CalendarDays, Phone, Scissors, UserRound, XCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function BookingList({ bookings, onCancel, onStatusChange, busyId }) {
  if (!bookings.length) return null
  return (
    <div className="booking-list">{bookings.map((booking) => (
      <article className="booking-row" key={booking.id}>
        <div className="booking-datebox"><CalendarDays size={17} /><b>{booking.date}</b><span>{booking.startTime} — {booking.endTime}</span></div>
        <div className="booking-details">
          <h3>{booking.serviceName || 'Кызмат'} <span>· {booking.price ?? '—'} сом</span></h3>
          <p><UserRound size={14} /> {booking.customerName || 'Кардар'} <span className="detail-separator">·</span><Scissors size={14} /> {booking.barberName || 'Барбер'}</p>
          {booking.customerPhone && <p><Phone size={14} /> {booking.customerPhone}</p>}
        </div>
        <div className="booking-controls"><StatusBadge status={booking.status} />
          {onStatusChange && <select aria-label="Статус" className="compact-select" value={booking.status} disabled={busyId === booking.id} onChange={(event) => onStatusChange(booking, event.target.value)}>
            <option value="pending">Күтүүдө</option><option value="confirmed">Ырасталды</option><option value="cancelled">Жокко чыгарылды</option>
          </select>}
          {onCancel && booking.status !== 'cancelled' && <button className="icon-button danger-icon" disabled={busyId === booking.id} title="Жазылууну жокко чыгаруу" onClick={() => onCancel(booking)}><XCircle size={18} /></button>}
        </div>
      </article>
    ))}</div>
  )
}
