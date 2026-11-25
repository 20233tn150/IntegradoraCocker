import { fmtCompact, fmtKg } from '../format.js'

function niceMax(value) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export default function YearBars({ serie = [], anio, anterior }) {
  const W = 780
  const H = 300
  const P = { top: 18, right: 12, bottom: 32, left: 48 }
  const plotW = W - P.left - P.right
  const plotH = H - P.top - P.bottom

  const values = serie.flatMap((mes) => [
    Number(mes.kilosActual || 0),
    Number(mes.kilosAnterior || 0)
  ])
  const rawMax = Math.max(...values, 0)
  const max = rawMax <= 0 ? 10 : niceMax(rawMax)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((factor) => max * factor)

  const groupW = plotW / 12
  const barW = Math.min(15, groupW * 0.3)

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Kilos de merma por mes en ${anio} comparados con ${anterior}`}
      >
        {ticks.map((tick) => {
          const y = P.top + plotH - (tick / max) * plotH
          return (
            <g key={tick} className="chart-grid">
              <line x1={P.left} y1={y} x2={W - P.right} y2={y} />
              <text x={P.left - 10} y={y + 4} textAnchor="end" className="chart-axis">
                {fmtCompact(tick)}
              </text>
            </g>
          )
        })}

        <line
          x1={P.left}
          y1={P.top + plotH}
          x2={W - P.right}
          y2={P.top + plotH}
          className="chart-base"
        />

        {serie.map((mes, index) => {
          const center = P.left + index * groupW + groupW / 2
          const actual = Number(mes.kilosActual || 0)
          const previo = Number(mes.kilosAnterior || 0)
          const hActual = (actual / max) * plotH
          const hPrevio = (previo / max) * plotH

          return (
            <g key={mes.mes}>
              <rect
                className="bar-prev"
                x={center - barW - 1.5}
                y={P.top + plotH - hPrevio}
                width={barW}
                height={Math.max(hPrevio, previo > 0 ? 2 : 0)}
                rx="2.5"
                style={{ animationDelay: `${index * 26}ms` }}
              >
                <title>{`${mes.etiqueta} ${anterior}: ${fmtKg(previo)}`}</title>
              </rect>
              <rect
                className="bar-now"
                x={center + 1.5}
                y={P.top + plotH - hActual}
                width={barW}
                height={Math.max(hActual, actual > 0 ? 2 : 0)}
                rx="2.5"
                style={{ animationDelay: `${index * 26 + 40}ms` }}
              >
                <title>{`${mes.etiqueta} ${anio}: ${fmtKg(actual)}`}</title>
              </rect>
              <text x={center} y={H - 8} textAnchor="middle" className="chart-axis x">
                {mes.etiqueta}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
