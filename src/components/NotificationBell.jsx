import { useEffect, useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { readLocalCatalog, saveLocalCatalog, subscribeLocalCatalog } from '../features/localAdmin/localCatalogService'
import { useAuth } from '../features/auth/authContext'
import { getErrorMessage } from '../utils/errors'
import Notice from './Notice'

export default function NotificationBell() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const unread = items.filter((item) => !item.read).length

  useEffect(() => {
    if (!user) return undefined
    const refresh = () => {
      try {
        const { notifications } = readLocalCatalog()
        setItems(notifications
          .filter((item) => item.recipientUid === user.uid || (profile?.role === 'admin' && item.recipientRole === 'admin'))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          .slice(0, 10))
        setError('')
      } catch (loadError) {
        setError(getErrorMessage(loadError))
      }
    }
    refresh()
    return subscribeLocalCatalog(refresh, (loadError) => setError(getErrorMessage(loadError)))
  }, [user, profile?.role])

  function markRead(item) {
    try {
      const catalog = readLocalCatalog()
      catalog.notifications = catalog.notifications.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice)
      saveLocalCatalog(catalog)
    } catch (readError) {
      setError(getErrorMessage(readError))
    }
  }

  if (!user) return null
  return (
    <div className="notification-wrap">
      <button className="icon-button notification-trigger" aria-label="Билдирмелер" onClick={() => setOpen(!open)}><Bell size={18} />{unread > 0 && <span className="notification-count">{unread}</span>}</button>
      {open && <div className="notification-popover"><div className="notification-head"><b>Билдирмелер</b><button className="icon-button" onClick={() => setOpen(false)} aria-label="Жабуу"><X size={17} /></button></div><Notice>{error}</Notice>
        {items.length ? items.map((item) => <button key={item.id} className={`notification-item ${item.read ? '' : 'notification-unread'}`} onClick={() => markRead(item)}><span>{item.message}</span>{!item.read && <Check size={15} />}</button>) : <p className="notification-empty">Жаңы билдирүү жок.</p>}
      </div>}
    </div>
  )
}
