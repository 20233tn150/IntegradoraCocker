import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import {
  currentYear,
  fmtKg,
  fmtMoney,
  fmtPct,
  fmtDate,
  MOTIVO_LABEL
} from '../format.js'
import Icon from '../components/Icons.jsx'
import Notice from '../components/Notice.jsx'
import Skeleton from '../components/Skeleton.jsx'
import YearBars from '../components/YearBars.jsx'
import TopBars from '../components/TopBars.jsx'

function Trend({ value }) {
  if (value === null) {
    return <span className="trend neutral">Sin comparativo</span>
  }
  const subio = value > 0
  return (
    <span className={`trend ${subio ? 'bad' : 'good'}`}>
      <Icon name={subio ? 'arrowUp' : 'arrowDown'} size={13} />
      {Math.abs(value).toFixed(1)}% vs año anterior
    </span>
  )
}

export default function Dashboard({ onNavigate }) {
  const [anio, setAnio] = useState(() => {
    // Permite abrir el panel en un año específico: /?anio=2027
    const param = Number(new URLSearchParams(window.location.search).get('anio'))
    return Number.isInteger(param) && param >= 2000 && param <= 2100 ? param : currentYear
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.dashboard(anio))
    } catch (e) {
      setError(`No se pudo cargar el panel: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio])

  const totalActual = useMemo(
    () => (data?.serieMensual || []).reduce((acc, mes) => acc + Number(mes.kilosActual || 0), 0),
    [data]
  )
  const totalAnterior = useMemo(
    () => (data?.serieMensual || []).reduce((acc, mes) => acc + Number(mes.kilosAnterior || 0), 0),
    [data]
  )
  const delta = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : null
  const topArea = data?.topAreas?.[0]
  const enAlmacen = Number(data?.kilosEnAlmacen || 0)
  const lotesEnAlmacen = Number(data?.lotesEnAlmacen || 0)

  const motivos = (data?.topMotivos || []).map((item) => ({
    nombre: MOTIVO_LABEL[item.motivo] || item.motivo,
    kilos: item.kilos,
    porcentaje: item.porcentaje
  }))

  // Años con datos registrados + el año actual + el año que se está viendo.
  const anios = useMemo(() => {
    const todos = new Set([currentYear, anio, ...(data?.aniosDisponibles || [])])
    return [...todos].sort((a, b) => b - a)
  }, [data, anio])

  if (loading) {
    return (
      <div className="module">
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="kpi" key={item}>
              <Skeleton rows={3} />
            </div>
          ))}
        </div>
        <div className="dash-grid">
          <div className="panel"><Skeleton rows={7} /></div>
          <div className="panel"><Skeleton rows={6} /></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="module">
        <Notice type="error" onClose={() => setError('')}>
          {error || 'No se pudo cargar el panel ejecutivo.'}
        </Notice>
        <section className="empty-state">
          <span className="empty-icon"><Icon name="alert" size={34} /></span>
          <h3>No pudimos cargar el panel</h3>
          <p>Revisa que el backend esté corriendo en el puerto 8080 y vuelve a intentarlo.</p>
          <button type="button" className="btn btn-accent" onClick={cargar}>
            <Icon name="refresh" size={16} />
            Reintentar
          </button>
        </section>
      </div>
    )
  }

  const hasData = Number(data.lotesTotales || 0) > 0 || totalActual > 0
  const gananciaNeta = Number(data.perdidaNeta || 0) < 0

  return (
    <div className="module">
      <div className="module-toolbar">
        <div className="year-switch" role="group" aria-label="Año del reporte">
          {anios.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className={opcion === anio ? 'active' : ''}
              onClick={() => setAnio(opcion)}
            >
              {opcion}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
          <Icon name="refresh" size={16} />
          Actualizar
        </button>
      </div>

      {error && <Notice type="error" onClose={() => setError('')}>{error}</Notice>}

      {!hasData ? (
        <section className="empty-state">
          <span className="empty-icon"><Icon name="leaf" size={36} /></span>
          <h3>Todavía no hay merma registrada en {anio}</h3>
          <p>
            Da de alta el primer lote para empezar a ver la pérdida económica, la tendencia
            mensual y los puntos críticos de tu operación.
          </p>
          <button type="button" className="btn btn-accent" onClick={() => onNavigate('registro')}>
            <Icon name="plus" size={16} />
            Registrar merma
          </button>
        </section>
      ) : (
        <>
          <section className="kpi-grid">
            <article className="kpi kpi-hero">
              <div className="kpi-top">
                <span className="kpi-label">
                  {gananciaNeta ? 'Ganancia neta del año' : 'Pérdida neta del año'}
                </span>
                <Icon name="money" size={20} />
              </div>
              <strong className="kpi-value">
                {fmtMoney(Math.abs(Number(data.perdidaNeta || 0)))}
              </strong>
              <span className="kpi-foot">
                {gananciaNeta
                  ? 'El pago por reciclaje superó el costo de la merma'
                  : 'Costo de la merma menos lo recuperado por reciclaje'}
              </span>
              <div className="kpi-hero-rule" />
            </article>

            <article className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Kilos generados</span>
                <Icon name="scale" size={18} />
              </div>
              <strong className="kpi-value">{fmtKg(data.kilosTotales)}</strong>
              <Trend value={delta} />
            </article>

            <article className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Costo de la merma</span>
                <Icon name="alert" size={18} />
              </div>
              <strong className="kpi-value">{fmtMoney(data.perdidaBruta)}</strong>
              <span className="kpi-foot">{data.lotesTotales} lotes valorizados</span>
            </article>

            <article className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Recuperado</span>
                <Icon name="refresh" size={18} />
              </div>
              <strong className="kpi-value">{fmtMoney(data.montoRecuperado)}</strong>
              <span className="kpi-foot">{data.enviosTotales} envíos a recicladoras</span>
            </article>
          </section>

          <div className="dash-grid">
            <section className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Tendencia</p>
                  <h2>Kilos de merma por mes</h2>
                </div>
                <div className="legend">
                  <span><i className="legend-dot now" /> {anio}</span>
                  <span><i className="legend-dot prev" /> {anio - 1}</span>
                </div>
              </div>
              <YearBars serie={data.serieMensual} anio={anio} anterior={anio - 1} />
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Fuga</p>
                  <h2>Puntos críticos</h2>
                </div>
                <span className="panel-tag">Top 5</span>
              </div>
              <p className="panel-note">
                Áreas y máquinas que concentran la mayor cantidad de kilos en {anio}.
              </p>
              <TopBars
                items={data.topAreas}
                tone="rust"
                emptyLabel="Registra el área de origen en tus lotes para ver este ranking."
              />
            </section>
          </div>

          <div className="dash-grid dash-grid-2">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Materiales</p>
                  <h2>Qué se está perdiendo</h2>
                </div>
              </div>
              <TopBars
                items={data.topMateriales}
                tone="forest"
                emptyLabel="Asocia un material a cada lote para ver su peso."
              />
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Causas</p>
                  <h2>Motivos recurrentes</h2>
                </div>
              </div>
              <TopBars
                items={motivos}
                tone="amber"
                showMoney={false}
                emptyLabel="Captura el motivo del desperdicio para detectar patrones."
              />
            </section>
          </div>

          <section className="insight-card">
            <span className="insight-icon">
              <Icon name={delta !== null && delta > 0 ? 'arrowUp' : 'arrowDown'} size={22} />
            </span>
            <div className="insight-copy">
              <p className="eyebrow">Lectura del periodo</p>
              <h3>
                {delta === null
                  ? `Primer año con registros: ${fmtKg(totalActual)} de merma`
                  : delta <= 0
                    ? `La merma bajó ${Math.abs(delta).toFixed(1)}% frente a ${anio - 1}`
                    : `La merma subió ${delta.toFixed(1)}% frente a ${anio - 1}`}
              </h3>
              <p>
                {topArea
                  ? `${topArea.nombre} es el punto crítico con ${fmtPct(topArea.porcentaje)} del total de kilos. `
                  : 'Aún no hay un área dominante en la merma. '}
                {lotesEnAlmacen > 0
                  ? `Hay ${lotesEnAlmacen} lotes (${fmtKg(enAlmacen)}) esperando salida a reciclaje.`
                  : 'No tienes lotes pendientes de salida a reciclaje.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => onNavigate(lotesEnAlmacen > 0 ? 'envios' : 'registro')}
            >
              {lotesEnAlmacen > 0 ? 'Ver salida a reciclaje' : 'Registrar merma'}
              <Icon name="chevron" size={16} />
            </button>
          </section>

          <p className="module-footnote">
            Última actualización: {fmtDate(new Date().toISOString().slice(0, 10))} · Los montos
            se calculan con el costo por kilo de cada material.
          </p>
        </>
      )}
    </div>
  )
}
