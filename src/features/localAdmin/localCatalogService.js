const STORAGE_KEY = 'golden-cut-local-catalog-v1'
const CHANGE_EVENT = 'golden-cut-local-catalog-change'

function dateOffset(offset) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  let remaining = offset
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0) remaining -= 1
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function createDemoCatalog() {
  const barber = {
    id: 'demo-barber',
    name: 'Адилет Осмонов',
    bio: 'Бардык классикалык жана заманбап эркектердин стилдери боюнча кесипкөй барбер.',
    photoUrl: '',
    skills: ['Классикалык стрижка', 'Fade', 'Сакалды түздөө'],
    workingDays: [1, 2, 3, 4, 5, 6],
    openTime: '10:00',
    closeTime: '20:00',
    active: true,
    accountUid: 'demo-barber',
  }
  const services = [
    { id: 'demo-service-cut', name: 'Стрижка', description: 'Чачты каалаган стилге келтирүү, формасын оңдоо жана тыкан көрүнүш берүү.', durationMinutes: 30, price: null, active: true },
    { id: 'demo-service-model', name: 'Моделдик стрижка', description: 'Заманбап жана өзгөчө стилдеги чач жасалгасы.', durationMinutes: 60, price: null, active: true },
    { id: 'demo-service-fade', name: 'Fade стрижка', description: 'Чачтын капталдарын акырындык менен кыскартып, стилдүү көрүнүш түзүү.', durationMinutes: 60, price: null, active: true },
    { id: 'demo-service-beard', name: 'Борода түздөө', description: 'Сакалды формага келтирүү жана тыкандоо.', durationMinutes: 30, price: null, active: true },
    { id: 'demo-service-complex', name: 'Комплекс', description: 'Чач алуу жана сакалды түздөө.', durationMinutes: 90, price: null, active: true },
  ]
  return { services, barbers: [barber], bookings: createDemoBookings(barber, services), notifications: [], seedVersion: 1 }
}

function createDemoBookings(barber, services) {
  const examples = [
    { name: 'Нурбек Асанов', phone: '+996 700 111 222', status: 'pending', startTime: '11:00' },
    { name: 'Эрмек Жумабеков', phone: '+996 555 333 444', status: 'confirmed', startTime: '14:00' },
    { name: 'Бакыт Токтосунов', phone: '+996 777 555 666', status: 'pending', startTime: '16:00' },
  ]
  return examples.map((example, index) => {
    const service = services[index] || services[0]
    const duration = Number(service.durationMinutes ?? service.duration ?? 30)
    const startMinutes = Number(example.startTime.slice(0, 2)) * 60 + Number(example.startTime.slice(3))
    const endMinutes = startMinutes + duration
    return {
      id: `demo-booking-${index + 1}`,
      userId: 'demo-customer',
      customerName: example.name,
      customerPhone: example.phone,
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      duration,
      price: service.price ?? null,
      date: dateOffset(index + 1),
      startTime: example.startTime,
      endTime: `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
      status: example.status,
      lockIds: [],
    }
  })
}

export function readLocalCatalog() {
  const serialized = window.localStorage.getItem(STORAGE_KEY)
  if (serialized === null) {
    const catalog = createDemoCatalog()
    saveLocalCatalog(catalog)
    return catalog
  }

  let catalog
  try {
    catalog = JSON.parse(serialized)
  } catch (error) {
    throw new Error(`Жергиликтүү каталогдун маалыматы окулбай жатат: ${error.message}`)
  }

  if (!catalog || !Array.isArray(catalog.services) || !Array.isArray(catalog.barbers)) {
    throw new Error('Жергиликтүү каталогдун форматы туура эмес. Админ панелинен маалыматтарды кайра сактаңыз.')
  }
  if (!Array.isArray(catalog.bookings)) catalog.bookings = []
  if (!Array.isArray(catalog.notifications)) catalog.notifications = []
  if (!catalog.seedVersion) {
    const defaults = createDemoCatalog()
    const existingNames = new Set(catalog.services.map((service) => service.name.trim().toLowerCase()))
    catalog.services.push(...defaults.services.filter((service) => !existingNames.has(service.name.toLowerCase())))
    if (!catalog.barbers.length) catalog.barbers = defaults.barbers
    if (!catalog.bookings.length) catalog.bookings = createDemoBookings(catalog.barbers[0], catalog.services)
    catalog.seedVersion = 1
    saveLocalCatalog(catalog)
  }
  return catalog
}

export function saveLocalCatalog(catalog) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeLocalCatalog(onChange, onError) {
  const refresh = () => {
    try {
      onChange(readLocalCatalog())
    } catch (error) {
      onError(error)
    }
  }
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) refresh()
  }

  window.addEventListener(CHANGE_EVENT, refresh)
  window.addEventListener('storage', handleStorage)
  refresh()

  return () => {
    window.removeEventListener(CHANGE_EVENT, refresh)
    window.removeEventListener('storage', handleStorage)
  }
}
