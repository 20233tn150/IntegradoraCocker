import { useState } from 'react'
import { api } from '../api.js'
import Icon from './Icons.jsx'

const CUENTAS_DEMO = [
  {
    usuario: 'admin@ecochain.mx',
    password: 'admin123',
    rol: 'Administrador',
    destino: 'Panel ejecutivo, catálogos y salida a reciclaje'
  },
  {
    usuario: 'operador@ecochain.mx',
    password: 'operador123',
    rol: 'Operador',
    destino: 'Registro de merma'
  }
]

export default function Login({ onLogin, aviso }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const entrar = async (event) => {
    event.preventDefault()
    setCargando(true)
    setError('')
    try {
      await onLogin(await api.auth.login({
        email: form.email.trim(),
        password: form.password
      }))
    } catch (e) {
      setError(e.message || 'No se pudo iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  const usarDemo = (cuenta) => {
    setForm({ email: cuenta.usuario, password: cuenta.password })
    setError('')
  }

  return (
    <div className="login-screen" role="application">
      <div className="login-card">
        <section className="login-brand">
          <span className="login-brand-mark">
            <Icon name="leaf" size={28} />
          </span>
          <div>
            <h1>EcoChain</h1>
            <p className="login-tagline">
              Auditoría interna de merma · tu rol define lo que ves
            </p>
            <ul className="login-bullets">
              <li>
                <Icon name="check" size={15} /> Kg y el costo real de cada lote
              </li>
              <li>
                <Icon name="check" size={15} /> Áreas y máquinas de fuga
              </li>
              <li>
                <Icon name="check" size={15} /> Reporte de pérdida neta
              </li>
            </ul>
            <p className="login-credenciales">
              Demo: <strong>admin@ecochain.mx / admin123</strong> ·{' '}
              <strong>operador@ecochain.mx / operador123</strong>
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Acceso</p>
              <h2>Inicia sesión</h2>
            </div>
            <Icon name="lock" size={22} />
          </div>

          {aviso && (
            <div className="notice info login-aviso">{aviso}</div>
          )}
          {error && (
            <div className="notice error" role="alert">{error}</div>
          )}

          <form className="login-form" onSubmit={entrar}>
            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="tucorreo@empresa.mx"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <button type="submit" className="btn btn-accent btn-block" disabled={cargando}>
              <Icon name="login" size={16} />
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="login-demo">
            <span className="login-demo-tag">Cuentas de demo</span>
            {CUENTAS_DEMO.map((cuenta) => (
              <button
                key={cuenta.usuario}
                type="button"
                className="btn btn-ghost btn-sm login-demo-btn"
                onClick={() => usarDemo(cuenta)}
              >
                {cuenta.rol}
                <small>{cuenta.usuario}</small>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
