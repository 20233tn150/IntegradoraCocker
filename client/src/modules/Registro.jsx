import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api.js'
import {
  ESTADOS,
  ESTADO_LABEL,
  MOTIVOS,
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

const nuevoFormulario = () => ({
  kilos: '',
  fecha: todayISO(),
  idMaterial: '',
  idArea: '',
  motivo: 'FALLA_CALIBRACION',
  observaciones: ''
})

export default function Registro({ soloLectura = false }) {
  const [lotes, setLotes] = useState([])
  const [materiales, setMateriales] = useState([])
  const [areas, setAreas] = useState([])
  const [anios, setAnios] = useState([])
  const [filtros, setFiltros] = useState({
    estado: '',
    idArea: '',
    idMaterial: '',
    anio: ''
  })
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(nuevoFormulario)
  const [editando, setEditando] = useState(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    Promise.all([api.materiales.list(), api.areas.list()])
      .then(([listaMateriales, listaAreas]) => {
        setMateriales(listaMateriales)
        setAreas(listaAreas)
      })
      .catch((e) => setError(`No se pudieron cargar los catálogos: ${e.message}`))
  }, [])

  useEffect(() => {
    api.lotes.anios()
      .then((lista) => setAnios(lista))
      .catch(() => setAnios([]))
  }, [])

  const cargarLotes = async () => {
    setLoading(true)
    setError('')
    try {
      setLotes(await api.lotes.list(filtros))
    } catch (e) {
      setError(`No se pudieron cargar los lotes: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.estado, filtros.idArea, filtros.idMaterial, filtros.anio])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const limpiarFiltros = () => {
    setFiltros({ estado: '', idArea: '', idMaterial: '', anio: '' })
    setBusqueda('')
    setError('')
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return lotes
    return lotes.filter((lote) => {
      const campos = [
        `#${lote.id}`,
        lote.materialNombre,
        lote.areaNombre,
        MOTIVO_LABEL[lote.motivo] || lote.motivo,
        ESTADO_LABEL[lote.estado] || lote.estado
      ]
      return campos.some((campo) => String(campo || '').toLowerCase().includes(texto))
    })
  }, [lotes, busqueda])

  const resumen = useMemo(
    () => visibles.reduce(
      (acc, lote) => ({
        kilos: acc.kilos + Number(lote.kilos || 0),
        costo: acc.costo + Number(lote.costoEstimado || 0),
        enAlmacen: acc.enAlmacen + (lote.idEnvio ? 0 : 1)
      }),
      { kilos: 0, costo: 0, enAlmacen: 0 }
    ),
    [visibles]
  )

  const pag = usePagination(visibles)

  // Volver a página 1 cuando cambian filtros o búsqueda
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pag.reset() }, [visibles.length, busqueda, filtros.estado, filtros.idArea, filtros.idMaterial, filtros.anio])

  const materialSeleccionado = materiales.find(
    (material) => String(material.id) === String(form.idMaterial)
  )
  const costoEstimado = materialSeleccionado
    ? Number(materialSeleccionado.costoPorKg || 0) * Number(form.kilos || 0)
    : 0

  const abrirNuevo = () => {
    setEditando(null)
    setForm(nuevoFormulario())
    setFormAbierto(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
  }

  const abrirEditar = (lote) => {
    setEditando(lote)
    setForm({
      kilos: String(lote.kilos ?? ''),
      fecha: lote.fecha,
      idMaterial: String(lote.idMaterial ?? ''),
      idArea: String(lote.idArea ?? ''),
      motivo: lote.motivo || 'OTRO',
      observaciones: lote.observaciones || ''
    })
    setFormAbierto(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
  }

  const cerrarFormulario = () => {
    setFormAbierto(false)
    setEditando(null)
    setForm(nuevoFormulario())
  }

  const guardar = async (event) => {
    event.preventDefault()
    if (!form.idMaterial || !form.idArea) {
      setError('Selecciona el área de origen y el material del lote.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      kilos: Number(form.kilos),
      fecha: form.fecha,
      idMaterial: Number(form.idMaterial),
      idArea: Number(form.idArea),
      motivo: form.motivo,
      observaciones: form.observaciones.trim() || null
    }
    try {
      if (editando) {
        await api.lotes.update(editando.id, payload)
        setNotice(`Lote #${editando.id} actualizado correctamente.`)
      } else {
        await api.lotes.create(payload)
        setNotice('Lote registrado y valorizado correctamente.')
      }
      setForm(nuevoFormulario())
      setEditando(null)
      setFormAbierto(false)
      await cargarLotes()
      const listaAnios = await api.lotes.anios()
      setAnios(listaAnios)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (lote) => {
    if (!window.confirm(`¿Eliminar el lote #${lote.id}? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      await api.lotes.remove(lote.id)
      setNotice(`Lote #${lote.id} eliminado.`)
      await cargarLotes()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="module">
      {soloLectura && (
        <span></span>
      )}

      <div className="module-toolbar module-toolbar-wrap">
        <div className="filter-row">
          <label className="inline-field">
            <Icon name="calendar" size={15} />
            <select
              value={filtros.anio}
              onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
              aria-label="Filtrar por año"
            >
              <option value="">Todos los años</option>
              {anios.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </label>

          {(Object.values(filtros).some((v) => v !== '') || busqueda) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}

          <label className="inline-field">
            <Icon name="warehouse" size={15} />
            <select
              value={filtros.idArea}
              onChange={(e) => setFiltros({ ...filtros, idArea: e.target.value })}
              aria-label="Filtrar por área"
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.nombre}</option>
              ))}
            </select>
          </label>

          <label className="inline-field">
            <Icon name="tag" size={15} />
            <select
              value={filtros.idMaterial}
              onChange={(e) => setFiltros({ ...filtros, idMaterial: e.target.value })}
              aria-label="Filtrar por material"
            >
              <option value="">Todos los materiales</option>
              {materiales.map((material) => (
                <option key={material.id} value={material.id}>{material.nombre}</option>
              ))}
            </select>
          </label>

          <label className="inline-field">
            <Icon name="filter" size={15} />
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </label>

          <label className="search-box">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Buscar por lote, área o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>

        {!soloLectura && (
          <button type="button" className="btn btn-accent" onClick={abrirNuevo}>
            <Icon name="plus" size={16} />
            Nuevo registro
          </button>
        )}
      </div>

      {error && <Notice type="error" onClose={() => setError('')}>{error}</Notice>}
      {notice && <Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>}

      <section className="stat-strip">
        <div><span>Lotes visibles</span><strong>{visibles.length}</strong></div>
        <div><span>Kilos</span><strong>{fmtKg(resumen.kilos)}</strong></div>
        <div><span>Costo valorizado</span><strong>{fmtMoney(resumen.costo)}</strong></div>
        <div><span>En almacén</span><strong>{resumen.enAlmacen}</strong></div>
      </section>

      {formAbierto && (
        <section className="panel form-panel" ref={formRef}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">{editando ? 'Edición' : 'Alta de merma'}</p>
              <h2>{editando ? `Editar lote #${editando.id}` : 'Registrar nuevo lote'}</h2>
            </div>
            <button type="button" className="icon-btn" onClick={cerrarFormulario} aria-label="Cerrar formulario">
              <Icon name="x" size={18} />
            </button>
          </div>

          <form className="form-grid" onSubmit={guardar}>
            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Área o máquina de origen</span>
              <select
                required
                value={form.idArea}
                onChange={(e) => setForm({ ...form, idArea: e.target.value })}
              >
                <option value="">Selecciona...</option>
                {areas.filter((area) => area.activo).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre} {area.tipo === 'MAQUINA' ? '· máquina' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Material</span>
              <select
                required
                value={form.idMaterial}
                onChange={(e) => setForm({ ...form, idMaterial: e.target.value })}
              >
                <option value="">Selecciona...</option>
                {materiales.filter((material) => material.activo).map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.nombre} · {fmtMoney(material.costoPorKg)}/kg
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Kilos desperdiciados</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={form.kilos}
                onChange={(e) => setForm({ ...form, kilos: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Motivo</span>
              <select
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              >
                {MOTIVOS.map((motivo) => (
                  <option key={motivo.value} value={motivo.value}>{motivo.label}</option>
                ))}
              </select>
            </label>

            <div className="field cost-preview">
              <span>Costo estimado de la pérdida</span>
              <strong>{fmtMoney(costoEstimado)}</strong>
              <small>
                {materialSeleccionado
                  ? `${fmtMoney(materialSeleccionado.costoPorKg)} por kg × ${form.kilos || 0} kg`
                  : 'Selecciona un material para valorizar'}
              </small>
            </div>

            <label className="field field-full">
              <span>Observaciones</span>
              <textarea
                rows="2"
                maxLength="500"
                placeholder="Ej. lote detectado al cambiar el molde..."
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </label>

            <div className="form-actions field-full">
              <button type="button" className="btn btn-ghost" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent" disabled={saving}>
                {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar lote'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Historial</p>
            <h2>Lotes de merma</h2>
          </div>
          <span className="panel-tag">{visibles.length} registros</span>
        </div>

        {loading ? (
          <Skeleton rows={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Material</th>
                  <th>Motivo</th>
                  <th className="right">Kilos</th>
                  <th className="right">Costo</th>
                  <th>Estado</th>
                  {!soloLectura && <th className="right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={soloLectura ? 8 : 9}>
                      <div className="empty-inline">
                        {soloLectura
                          ? 'No hay lotes que coincidan con los filtros. Ajusta año, fechas o búsqueda.'
                          : 'No hay lotes que coincidan con los filtros. Registra uno nuevo o limpia los filtros.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  pag.slice.map((lote) => {
                    const enviado = Boolean(lote.idEnvio)
                    return (
                      <tr key={lote.id}>
                        <td className="mono">#{lote.id}</td>
                        <td>{fmtDate(lote.fecha)}</td>
                        <td>{lote.areaNombre || '—'}</td>
                        <td>
                          <span className="cell-strong">{lote.materialNombre || '—'}</span>
                          {lote.materialCategoria && (
                            <span className="cell-sub">{lote.materialCategoria}</span>
                          )}
                        </td>
                        <td>{MOTIVO_LABEL[lote.motivo] || lote.motivo || '—'}</td>
                        <td className="right mono">{fmtKg(lote.kilos)}</td>
                        <td className="right mono">{fmtMoney(lote.costoEstimado)}</td>
                        <td>
                          <span
                            className={`badge ${enviado ? 'enviado' : 'en-almacen'}`}
                            title={enviado
                              ? `Incluido en el envío #${lote.idEnvio}`
                              : 'Pendiente de salida a reciclaje'}
                          >
                            {enviado ? 'Enviado' : 'En almacén'}
                          </span>
                        </td>
                        {!soloLectura && (
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => abrirEditar(lote)}
                                disabled={enviado}
                                title={enviado ? 'Ya fue enviado a reciclaje' : 'Editar lote'}
                                aria-label={`Editar lote ${lote.id}`}
                              >
                                <Icon name="edit" size={16} />
                              </button>
                              <button
                                type="button"
                                className="icon-btn danger"
                                onClick={() => eliminar(lote)}
                                disabled={enviado}
                                title={enviado ? 'Ya fue enviado a reciclaje' : 'Eliminar lote'}
                                aria-label={`Eliminar lote ${lote.id}`}
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            <Pagination pagina={pag.pagina} totalPaginas={pag.totalPaginas} total={pag.total} ir={pag.ir} />
          </div>
        )}
      </section>
    </div>
  )
}
