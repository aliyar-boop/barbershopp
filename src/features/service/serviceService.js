import { readLocalCatalog, subscribeLocalCatalog } from '../localAdmin/localCatalogService'

export function getServiceDescription(service) {
  return service.description || ''
}

export function getServiceDuration(service) {
  return Number(service.durationMinutes ?? service.duration ?? 30)
}

export async function listServices(includeInactive = false) {
  const { services } = readLocalCatalog()
  return services.filter((service) => includeInactive || service.active !== false)
}

export function watchServices(onChange, onError, includeInactive = false) {
  const update = () => {
    try {
      const { services } = readLocalCatalog()
      onChange(services.filter((service) => includeInactive || service.active !== false))
    } catch (error) {
      onError?.(error)
    }
  }
  update()
  return subscribeLocalCatalog(update)
}
