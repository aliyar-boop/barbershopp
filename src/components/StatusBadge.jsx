export default function StatusBadge({ status }) {
  const labels = { pending: 'Күтүүдө', confirmed: 'Ырасталды', cancelled: 'Жокко чыгарылды' }
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>
}
