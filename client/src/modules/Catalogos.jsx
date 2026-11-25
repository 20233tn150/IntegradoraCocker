import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { TIPOS_AREA, fmtMoney } from '../format.js'
import Icon from '../components/Icons.jsx'
import Notice from '../components/Notice.jsx'
import Skeleton from '../components/Skeleton.jsx'
import Pagination, { usePagination } from '../components/Pagination.jsx'

const materialVacio = { nombre: '', categoria: '', costoPorKg: '', activo: true }
const areaVacia = { nombre: '', tipo: 'AREA', ubicacion: '', responsable: '', activo: true }

export default function Catalogos() {
  const [materiales, setMateriales] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [materialForm, setMaterialForm] = useState(materialVacio)
  const [materialEditando, setMaterialEditando] = useState(null)
  const [areaForm, setAreaForm] = useState(areaVacia)
  const [areaEditando, setAreaEditando] = useState(null)

  const pagMat = usePagination(materiales)
  const pagArea = usePagination(areas)

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const [listaMateriales, listaAreas] = await Promise.all([
        api.materiales.list(),
        api.areas.list()
      ])
      setMateriales(listaMateriales)
      setAreas(listaAreas)
    } catch (e) {
      setError(`No se pudieron cargar los catálogos: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const guardarMaterial = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      nombre: materialForm.nombre.trim(),
      categoria: materialForm.categoria.trim() || null,
      costoPorKg: Number(materialForm.costoPorKg || 0),
      activo: materialForm.activo
    }
    try {
      if (materialEditando) {
        await api.materiales.update(materialEditando.id, payload)
        setNotice('Material actualizado.')
      } else {
        await api.materiales.create(payload)
        setNotice('Material agregado al catálogo.')
      }
      setMaterialForm(materialVacio)
      setMaterialEditando(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const guardarArea = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      nombre: areaForm.nombre.trim(),
      tipo: areaForm.tipo,
      ubicacion: areaForm.ubicacion.trim() || null,
      responsable: areaForm.responsable.trim() || null,
      activo: areaForm.activo
    }
    try {
      if (areaEditando) {
        await api.areas.update(areaEditando.id, payload)
        setNotice('Área o máquina actualizada.')
      } else {
        await api.areas.create(payload)
        setNotice('Área o máquina agregada al catálogo.')
      }
      setAreaForm(areaVacia)
      setAreaEditando(null)
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const editarMaterial = (material) => {
    setMaterialEditando(material)
    setMaterialForm({
      nombre: material.nombre || '',
      categoria: material.categoria || '',
      costoPorKg: String(material.costoPorKg ?? ''),
      activo: material.activo !== false
    })
  }

  const editarArea = (area) => {
    setAreaEditando(area)
    setAreaForm({
      nombre: area.nombre || '',
      tipo: area.tipo || 'AREA',
      ubicacion: area.ubicacion || '',
      responsable: area.responsable || '',
      activo: area.activo !== false
    })
  }

  const eliminarMaterial = async (material) => {
    if (!window.confirm(`¿Eliminar el material "${material.nombre}"?`)) return
    try {
      await api.materiales.remove(material.id)
      setNotice('Material eliminado.')
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  const eliminarArea = async (area) => {
    if (!window.confirm(`¿Eliminar "${area.nombre}"?`)) return
    try {
      await api.areas.remove(area.id)
      setNotice('Área o máquina eliminada.')
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="module">
      {error && <Notice type="error" onClose={() => setError('')}>{error}</Notice>}
      {notice && <Notice type="success" onClose={() => setNotice('')}>{notice}</Notice>}

      <div className="catalog-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Catálogo 01</p>
              <h2>Materiales y costo por kilo</h2>
            </div>
            <span className="panel-tag">{materiales.length}</span>
          </div>
          <p className="panel-note">
            El costo por kg es la base del cálculo: kilos × costo = dinero perdido.
            Los inactivos dejan de aparecer al registrar merma.
          </p>

          <form className="form-grid form-grid-compact" onSubmit={guardarMaterial}>
            <label className="field">
              <span>Nombre</span>
              <input
                required
                maxLength="100"
                placeholder="Ej. PET"
                value={materialForm.nombre}
                onChange={(e) => setMaterialForm({ ...materialForm, nombre: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Categoría</span>
              <input
                maxLength="80"
                placeholder="Plásticos, metales..."
                value={materialForm.categoria}
                onChange={(e) => setMaterialForm({ ...materialForm, categoria: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Costo por kg (MXN)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={materialForm.costoPorKg}
                onChange={(e) => setMaterialForm({ ...materialForm, costoPorKg: e.target.value })}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={materialForm.activo}
                onChange={(e) => setMaterialForm({ ...materialForm, activo: e.target.checked })}
              />
              <span>Activo</span>
            </label>
            <div className="form-actions field-full">
              {materialEditando && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setMaterialEditando(null); setMaterialForm(materialVacio) }}
                >
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>
                {materialEditando ? 'Guardar cambios' : 'Agregar material'}
              </button>
            </div>
          </form>

          {loading ? (
            <Skeleton rows={4} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Categoría</th>
                    <th className="right">Costo / kg</th>
                    <th>Estado</th>
                    <th className="right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.length === 0 ? (
                    <tr>
                      <td colSpan="5"><div className="empty-inline">Agrega tu primer material.</div></td>
                    </tr>
                  ) : pagMat.slice.map((material) => (
                    <tr key={material.id}>
                      <td className="cell-strong">{material.nombre}</td>
                      <td>{material.categoria || '—'}</td>
                      <td className="right mono">{fmtMoney(material.costoPorKg)}</td>
                      <td>
                        <span className={`badge ${material.activo ? 'activo' : 'inactivo'}`}>
                          {material.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => editarMaterial(material)}
                            aria-label={`Editar ${material.nombre}`}
                            title="Editar"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => eliminarMaterial(material)}
                            aria-label={`Eliminar ${material.nombre}`}
                            title="Eliminar"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination pagina={pagMat.pagina} totalPaginas={pagMat.totalPaginas} total={pagMat.total} ir={pagMat.ir} />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Catálogo 02</p>
              <h2>Áreas y máquinas</h2>
            </div>
            <span className="panel-tag">{areas.length}</span>
          </div>
          <p className="panel-note">
            Cada lote se asocia a un área o máquina para responder dónde se está fugando
            el material.
          </p>

          <form className="form-grid form-grid-compact" onSubmit={guardarArea}>
            <label className="field">
              <span>Nombre</span>
              <input
                required
                maxLength="100"
                placeholder="Ej. Inyectora 1"
                value={areaForm.nombre}
                onChange={(e) => setAreaForm({ ...areaForm, nombre: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Tipo</span>
              <select
                value={areaForm.tipo}
                onChange={(e) => setAreaForm({ ...areaForm, tipo: e.target.value })}
              >
                {TIPOS_AREA.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ubicación</span>
              <input
                maxLength="120"
                placeholder="Nave A..."
                value={areaForm.ubicacion}
                onChange={(e) => setAreaForm({ ...areaForm, ubicacion: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Responsable</span>
              <input
                maxLength="120"
                placeholder="Nombre"
                value={areaForm.responsable}
                onChange={(e) => setAreaForm({ ...areaForm, responsable: e.target.value })}
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                checked={areaForm.activo}
                onChange={(e) => setAreaForm({ ...areaForm, activo: e.target.checked })}
              />
              <span>Activa</span>
            </label>
            <div className="form-actions field-full">
              {areaEditando && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setAreaEditando(null); setAreaForm(areaVacia) }}
                >
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>
                {areaEditando ? 'Guardar cambios' : 'Agregar área'}
              </button>
            </div>
          </form>

          {loading ? (
            <Skeleton rows={4} />
          ) : (
            <div className="table-wrap">
              <table style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ width: '34%' }}>Nombre</th>
                    <th style={{ width: '14%' }}>Tipo</th>
                    <th style={{ width: '20%' }}>Ubicación</th>
                    <th style={{ width: '20%' }}>Responsable</th>
                    <th style={{ width: '7%' }}>Estado</th>
                    <th className="right" style={{ width: '5%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan="6"><div className="empty-inline">Agrega tu primera área o máquina.</div></td>
                    </tr>
                  ) : pagArea.slice.map((area) => (
                    <tr key={area.id}>
                      <td className="cell-strong">{area.nombre}</td>
                      <td>
                        <span className="mini-tag">{area.tipo === 'MAQUINA' ? 'Máquina' : 'Área'}</span>
                      </td>
                      <td>{area.ubicacion || '—'}</td>
                      <td>{area.responsable || '—'}</td>
                      <td>
                        <span className={`badge ${area.activo ? 'activo' : 'inactivo'}`} style={{ whiteSpace: 'nowrap' }}>
                          {area.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => editarArea(area)}
                            aria-label={`Editar ${area.nombre}`}
                            title="Editar"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => eliminarArea(area)}
                            aria-label={`Eliminar ${area.nombre}`}
                            title="Eliminar"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination pagina={pagArea.pagina} totalPaginas={pagArea.totalPaginas} total={pagArea.total} ir={pagArea.ir} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
