export default function Skeleton({ rows = 4, className = '' }) {
  return (
    <div className={`skeleton ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index} className="skeleton-line" style={{ width: `${88 - index * 9}%` }} />
      ))}
    </div>
  )
}
