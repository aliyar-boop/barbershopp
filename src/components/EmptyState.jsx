import { CalendarDays } from 'lucide-react'

export default function EmptyState({ children = 'Азырынча маалымат жок.' }) {
  return <div className="empty-state"><CalendarDays size={28} /><p>{children}</p></div>
}
