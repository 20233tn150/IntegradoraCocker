import { fmtKg, fmtMoney, fmtPct } from '../format.js'

export default function TopBars({
  items = [],
  tone = 'rust',
  emptyLabel = 'Sin datos todavía',
  showMoney = true
}) {
  if (!items.length) {
    return <p className="empty-inline">{emptyLabel}</p>
  }

  const max = Math.max(...items.map((item) => Number(item.kilos || 0)), 1)

  return (
    <ol className="top-bars">
      {items.map((item, index) => (
        <li key={`${item.id ?? item.nombre}-${index}`}>
          <div className="top-bar-head">
            <span className="top-bar-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="top-bar-name">{item.nombre}</span>
            <span className="top-bar-kg">{fmtKg(item.kilos)}</span>
          </div>
          <div className="top-bar-track">
            <span
              className={`top-bar-fill ${tone}`}
              style={{
                width: `${Math.max((Number(item.kilos || 0) / max) * 100, 2)}%`,
                animationDelay: `${index * 70}ms`
              }}
            />
          </div>
          <div className="top-bar-meta">
            <span>{fmtPct(item.porcentaje)} del total</span>
            {showMoney && <span>{fmtMoney(item.perdida)}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}
