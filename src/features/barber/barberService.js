import { readLocalCatalog, saveLocalCatalog, subscribeLocalCatalog } from '../localAdmin/localCatalogService'

export async function listBarbers(includeInactive = false) {
  const { barbers } = readLocalCatalog()
  return barbers.filter((barber) => includeInactive || barber.active !== false)
}

export function watchBarbers(onChange, onError, includeInactive = false) {
  const update = () => {
    try {
      const { barbers } = readLocalCatalog()
      onChange(barbers.filter((barber) => includeInactive || barber.active !== false))
    } catch (error) {
      onError?.(error)
    }
  }
  update()
  return subscribeLocalCatalog(update)
}

export async function getBarberForAccount(uid) {
  return readLocalCatalog().barbers.find((barber) => barber.accountUid === uid) || null
}

export async function saveBarber(values, id) {
  const catalog = readLocalCatalog()
  const data = {
    ...values,
    name: values.name.trim(),
    photoUrl: values.photoUrl?.trim() || '',
    bio: values.bio?.trim() || '',
    skills: Array.isArray(values.skills) ? values.skills : [],
    accountUid: values.accountUid?.trim() || '',
    active: values.active !== false,
  }
  if (!data.name) throw new Error('Барбердин атын киргизиңиз.')
  if (data.bio.length > 500) throw new Error('Кесиптик маалымат 500 белгиден ашпашы керек.')
  if (id) catalog.barbers = catalog.barbers.map((barber) => barber.id === id ? { ...barber, ...data } : barber)
  else catalog.barbers.push({ ...data, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` })
  saveLocalCatalog(catalog)
}

export async function removeBarber(id) {
  const catalog = readLocalCatalog()
  catalog.barbers = catalog.barbers.filter((barber) => barber.id !== id)
  saveLocalCatalog(catalog)
}
