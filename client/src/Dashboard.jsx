import { useEffect, useState } from 'react'

// En Docker/Nginx el proxy redirige /api al contenedor "backend".
// En local (npm run dev) el proxy de Vite hace lo mismo hacia localhost:8080.
const API_URL = import.meta.env.VITE_API_URL || '/api'

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO']

export default function Dashboard() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    kilos: '',
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'PENDIENTE',
    idMaterial: ''
  })

  // --- READ ---
  const cargarLotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/lotes`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLotes(data)
    } catch (e) {
      setError('No se pudo conectar con el backend: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLotes()
  }, [])

  // --- CREATE ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/lotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kilos: parseFloat(form.kilos),
          fecha: form.fecha,
          estado: form.estado,
          idMaterial: form.idMaterial ? parseInt(form.idMaterial, 10) : null
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setForm({ ...form, kilos: '', idMaterial: '' })
      await cargarLotes()
    } catch (e) {
      setError('Error al guardar el lote: ' + e.message)
    }
  }

  // --- DELETE ---
  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este lote?')) return
    await fetch(`${API_URL}/lotes/${id}`, { method: 'DELETE' })
    cargarLotes()
  }

  const totalKilos = lotes.reduce((acc, l) => acc + Number(l.kilos), 0).toFixed(2)

  return (
    <main className="dashboard">
      <section className="cards">
        <div className="card">
          <span className="card-label">Lotes registrados</span>
          <span className="card-value">{lotes.length}</span>
        </div>
        <div className="card">
          <span className="card-label">Kilos totales de merma</span>
          <span className="card-value">{totalKilos} kg</span>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      {/* ---------- FORMULARIO ---------- */}
      <section className="panel">
        <h2>Registrar nuevo lote</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Kilos
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.kilos}
              onChange={(e) => setForm({ ...form, kilos: e.target.value })}
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </label>

          <label>
            Estado
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label>
            ID Material
            <input
              type="number"
              min="1"
              placeholder="ej. 1"
              value={form.idMaterial}
              onChange={(e) => setForm({ ...form, idMaterial: e.target.value })}
            />
          </label>

          <button type="submit">Guardar lote</button>
        </form>
      </section>

      {/* ---------- TABLA ---------- */}
      <section className="panel">
        <h2>Lotes de merma</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kilos</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>ID Material</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 ? (
                <tr>
                  <td colSpan="6">No hay lotes registrados aún.</td>
                </tr>
              ) : (
                lotes.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.kilos} kg</td>
                    <td>{l.fecha}</td>
                    <td>
                      <span className={`badge ${l.estado?.toLowerCase()}`}>
                        {l.estado}
                      </span>
                    </td>
                    <td>{l.idMaterial ?? '—'}</td>
                    <td>
                      <button
                        className="danger"
                        onClick={() => eliminar(l.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
