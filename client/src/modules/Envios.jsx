import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import {
  MOTIVO_LABEL,
  fmtDate,
  fmtKg,
  fmtMoney,
  todayISO
} from '../format.js'
import Icon from '../components/Icons.jsx'
import Notice from '../components/Notice.jsx'
import Skeleton from '../components/Skeleton.jsx'
import Pagination, { usePagination } from '../components/Pagination.jsx'

const formularioVacio = () => ({
  fecha: todayISO(),
  recicladora: '',
  montoRecuperado: '',
  notas: ''
})

export default function Envios() {
  const [disponibles, setDisponibles] = useState([])
  const [envios, setEnvios] = useState([])
  const [seleccion, setSeleccion] = useState([])
  const [form, setForm] = useState(formularioVacio)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const pagDisp = usePagination(disponibles)
  const pagEnvios = usePagination(envios)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const [lotesDisponibles, historial] = await Promise.all([
        api.lotes.disponibles(),
        api.envios.list()
      ])
      setDisponibles(lotesDisponibles)
      setEnvios(historial)
    } catch (e) {
      setError(`No se pudieron cargar los envíos: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  const seleccionados = useMemo(
    () => disponibles.filter((lote) => seleccion.includes(lote.id)),
    [disponibles, seleccion]
  )

  const totales = useMemo(
    () => seleccionados.reduce(
      (acc, lote) => ({
        kilos: acc.kilos + Number(lote.kilos || 0),
        costo: acc.costo + Number(lote.costoEstimado || 0)
      }),
      { kilos: 0, costo: 0 }
    ),
    [seleccionados]
  )

  const recuperado = Number(form.montoRecuperado || 0)
  const perdidaNeta = totales.costo - recuperado
  const todosSeleccionados = disponibles.length > 0 && seleccion.length === disponibles.length

  const alternar = (id) => {
    setSeleccion((actual) => (
      actual.includes(id) ? actual.filter((item) => item !== id) : [...actual, id]
    ))
  }

  const alternarTodos = () => {
    setSeleccion(todosSeleccionados ? [] : disponibles.map((lote) => lote.id))
  }

  const enviar = async (event) => {
    event.preventDefault()
    if (seleccion.length === 0) {
      setError('Selecciona al menos un lote para registrar el envío.')
      return
    }
    if (!form.recicladora.trim()) {
      setError('Indica el nombre de la recicladora.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api.envios.create({
        fecha: form.fecha,
        recicladora: form.recicladora.trim(),
        montoRecuperado: recuperado,
        notas: form.notas.trim() || null,
        loteIds: seleccion
      })
      setNotice('Envío registrado. Los lotes pasaron a estado "Enviado".')
      setForm(formularioVacio())
      setSeleccion([])
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const revertir = async (envio) => {
    if (!window.confirm(
      `¿Revertir el envío a ${envio.recicladora}? Los ${envio.lotesCount} lotes volverán a almacén.`
    )) {
      return
    }
    try {
      await api.envios.remove(envio.id)
      setNotice('Envío revertido. Los lotes volvieron a almacén.')
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="module">
      {error && <Notice type="error" onClose={() => setError('')}>{error}</Notice>}
      {notice && <Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>}

      <div className="shipment-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Inventario</p>
              <h2>Lotes en almacén</h2>
            </div>
            <span className="panel-tag">{disponibles.length} disponibles</span>
          </div>
          <p className="panel-note">
            Selecciona los lotes que saldrán juntos hacia la recicladora.
          </p>

          {loading ? (
            <Skeleton rows={6} />
          ) : disponibles.length === 0 ? (
            <div className="empty-inline">
              No hay lotes pendientes de salida. Todo lo registrado ya se envió a reciclaje.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="check-col">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={alternarTodos}
                        aria-label="Seleccionar todos los lotes"
                      />
                    </th>
                    <th>Lote</th>
                    <th>Fecha</th>
                    <th>Origen</th>
                    <th>Material</th>
                    <th className="right">Kilos</th>
                    <th className="right">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {pagDisp.slice.map((lote) => {
                    const activo = seleccion.includes(lote.id)
                    return (
                      <tr key={lote.id} className={activo ? 'selected' : ''}>
                        <td className="check-col">
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => alternar(lote.id)}
                            aria-label={`Seleccionar lote ${lote.id}`}
                          />
                        </td>
                        <td className="mono">#{lote.id}</td>
                        <td>{fmtDate(lote.fecha)}</td>
                        <td>{lote.areaNombre || '—'}</td>
                        <td>
                          <span className="cell-strong">{lote.materialNombre || '—'}</span>
                          <span className="cell-sub">{MOTIVO_LABEL[lote.motivo] || lote.motivo}</span>
                        </td>
                        <td className="right mono">{fmtKg(lote.kilos)}</td>
                        <td className="right mono">{fmtMoney(lote.costoEstimado)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination pagina={pagDisp.pagina} totalPaginas={pagDisp.totalPaginas} total={pagDisp.total} ir={pagDisp.ir} />
            </div>
          )}
        </section>

        <section className="panel shipment-form">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Cierre de ciclo</p>
              <h2>Nuevo envío</h2>
            </div>
            <Icon name="truck" size={22} />
          </div>

          <form className="stack-form" onSubmit={enviar}>
            <label className="field">
              <span>Recicladora</span>
              <input
                maxLength="160"
                required
                placeholder="Ej. Recicladora Delta"
                value={form.recicladora}
                onChange={(e) => setForm({ ...form, recicladora: e.target.value })}
              />
            </label>

            <div className="form-grid form-grid-compact">
              <label className="field">
                <span>Fecha de salida</span>
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Monto recuperado (MXN)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.montoRecuperado}
                  onChange={(e) => setForm({ ...form, montoRecuperado: e.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Notas</span>
              <textarea
                rows="2"
                maxLength="500"
                placeholder="Factura, folio o comentarios..."
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </label>

            <div className="shipment-summary">
              <div>
                <span>Lotes seleccionados</span>
                <strong>{seleccionados.length}</strong>
              </div>
              <div>
                <span>Kilos</span>
                <strong>{fmtKg(totales.kilos)}</strong>
              </div>
              <div>
                <span>Costo de la merma</span>
                <strong>{fmtMoney(totales.costo)}</strong>
              </div>
              <div>
                <span>Recuperado</span>
                <strong>{fmtMoney(recuperado)}</strong>
              </div>
              <div className={perdidaNeta >= 0 ? 'net-loss' : 'net-gain'}>
                <span>
                  {perdidaNeta >= 0 ? 'Pérdida neta del envío' : 'Ganancia neta del envío'}
                </span>
                <strong>{fmtMoney(Math.abs(perdidaNeta))}</strong>
              </div>
            </div>

            {perdidaNeta < 0 && seleccionados.length > 0 && (
              <p className="shipment-hint">
                El monto recuperado supera el costo de la merma seleccionada: el envío deja
                una ganancia, no una pérdida.
              </p>
            )}

            <button
              type="submit"
              className="btn btn-accent btn-block"
              disabled={saving || seleccion.length === 0}
            >
              <Icon name="truck" size={17} />
              {saving ? 'Registrando envío...' : `Enviar ${seleccionados.length} lote(s) a reciclaje`}
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Historial</p>
            <h2>Envíos a reciclaje</h2>
          </div>
          <span className="panel-tag">{envios.length} envíos</span>
        </div>

        {loading ? (
          <Skeleton rows={5} />
        ) : envios.length === 0 ? (
          <div className="empty-inline">
            Aún no has cerrado ningún envío. Cuando acumules lotes en almacén, selecciónalos
            arriba y registra cuánto dinero recuperaste.
          </div>
        ) : (
          <>
            <div className="shipment-list">
              {pagEnvios.slice.map((envio) => {
                const neto = Number(envio.costoTotal || 0) - Number(envio.montoRecuperado || 0)
                return (
                  <article className="shipment-card" key={envio.id}>
                    <header>
                      <div className="shipment-title">
                        <span className="shipment-date">{fmtDate(envio.fecha)}</span>
                        <h3>{envio.recicladora}</h3>
                        <span className="cell-sub">
                          {envio.lotesCount} lotes · {fmtKg(envio.kilosTotales)} · costo{' '}
                          {fmtMoney(envio.costoTotal)}
                        </span>
                      </div>
                      <div className="shipment-money">
                        <span>Recuperado</span>
                        <strong>{fmtMoney(envio.montoRecuperado)}</strong>
                        <em className={neto >= 0 ? 'net-loss' : 'net-gain'}>
                          {neto >= 0 ? 'Pérdida neta ' : 'Ganancia neta '}
                          {fmtMoney(Math.abs(neto))}
                        </em>
                      </div>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => revertir(envio)}
                        title="Revertir envío"
                        aria-label={`Revertir envío a ${envio.recicladora}`}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </header>

                    <details>
                      <summary>
                        <Icon name="chevron" size={14} />
                        Ver lotes del envío
                      </summary>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Lote</th>
                              <th>Fecha</th>
                              <th>Origen</th>
                              <th>Material</th>
                              <th className="right">Kilos</th>
                              <th className="right">Costo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {envio.lotes.map((lote) => (
                              <tr key={lote.id}>
                                <td className="mono">#{lote.id}</td>
                                <td>{fmtDate(lote.fecha)}</td>
                                <td>{lote.areaNombre || '—'}</td>
                                <td>{lote.materialNombre || '—'}</td>
                                <td className="right mono">{fmtKg(lote.kilos)}</td>
                                <td className="right mono">{fmtMoney(lote.costoEstimado)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {envio.notas && <p className="shipment-note">{envio.notas}</p>}
                    </details>
                  </article>
                )
              })}
            </div>
            <Pagination pagina={pagEnvios.pagina} totalPaginas={pagEnvios.totalPaginas} total={pagEnvios.total} ir={pagEnvios.ir} />
          </>
        )}
      </section>
    </div>
  )
}
