export default function Loading({ label = 'Жүктөлүүдө...' }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>
}
