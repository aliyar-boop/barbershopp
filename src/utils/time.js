export const OPENING_MINUTES = 10 * 60
export const CLOSING_MINUTES = 20 * 60
export const SLOT_MINUTES = 30

export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function getTimeSlots(duration = SLOT_MINUTES, opening = OPENING_MINUTES, closing = CLOSING_MINUTES) {
  const slots = []
  for (let start = opening; start + duration <= closing; start += SLOT_MINUTES) {
    slots.push({ startTime: toTime(start), endTime: toTime(start + duration) })
  }
  return slots
}

export function getLockIds(barberId, date, startTime, duration) {
  const start = toMinutes(startTime)
  const firstSlot = (start - OPENING_MINUTES) / SLOT_MINUTES
  const count = duration / SLOT_MINUTES
  return Array.from({ length: count }, (_, index) =>
    `${barberId}_${date}_${firstSlot + index}`,
  )
}

export function isPastSlot(date, startTime) {
  return new Date(`${date}T${startTime}:00+06:00`).getTime() <= Date.now()
}

export function isWorkingDay(date, workingDays = [1, 2, 3, 4, 5, 6]) {
  const [year, month, dayOfMonth] = date.split('-').map(Number)
  const day = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()
  return workingDays.includes(day)
}

export function todayString() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Bishkek',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}
