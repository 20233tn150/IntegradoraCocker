import { useEffect, useState } from 'react'
import Dashboard from './modules/Dashboard.jsx'
import Registro from './modules/Registro.jsx'
import Catalogos from './modules/Catalogos.jsx'
import Envios from './modules/Envios.jsx'
import Login from './components/Login.jsx'
import Icon from './components/Icons.jsx'
import { api, getToken, setToken } from './api.js'

const MODULOS = [
  {
    id: 'dashboard',
    roles: ['ADMINISTRADOR'],
    nav: 'Panel',
    titulo: 'Panel ejecutivo',
    subtitulo: 'Dónde se fuga, cuánto cuesta y si la operación está mejorando.',
    icono: 'dashboard'
  },
  {
    id: 'registro',
    roles: ['ADMINISTRADOR', 'OPERADOR'],
    nav: 'Registro',
    titulo: 'Registro de merma',
    subtitulo: 'Alta, edición y eliminación de lotes generados en planta.',
    icono: 'box'
  },
  {
    id: 'catalogos',
    roles: ['ADMINISTRADOR'],
    nav: 'Catálogos',
    titulo: 'Catálogos y costos',
    subtitulo: 'Áreas, máquinas y costo por kilo: la base para valorizar la pérdida.',
    icono: 'tag'
  },
  {
    id: 'envios',
    roles: ['ADMINISTRADOR'],
    nav: 'Salida',
    titulo: 'Salida a reciclaje',
    subtitulo: 'Selecciona lotes, regístralos como enviados y anota lo recuperado.',
    icono: 'truck'
  }
]

const fechaLarga = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(new Date())

const iniciales = (nombre = '') =>
  nombre.split(/\s+/).filter(Boolean).map((parte) => parte[0]).join('').slice(0, 2) || '?'

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [comprobando, setComprobando] = useState(true)
  const [avisoSesion, setAvisoSesion] = useState('')
  const [activo, setActivo] = useState('registro')
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  useEffect(() => {
    api.onSesionTerminada(() => {
      setSesion(null)
      setAvisoSesion('Tu sesión expiró o no es válida. Inicia sesión de nuevo.')
    })

    if (!getToken()) {
      setComprobando(false)
      return undefined
    }

    api.auth.me()
      .then((usuario) => setSesion({ usuario }))
      .catch(() => setToken(''))
      .finally(() => setComprobando(false))
    return undefined
  }, [])

  const rol = sesion?.usuario.rol || ''
  const esAdmin = rol === 'ADMINISTRADOR'
  const modulo = MODULOS.find((item) => item.id === activo) || MODULOS[0]
  const visibles = MODULOS.filter((item) => item.roles.includes(rol))

  const destinoPorDefecto = (rolActual) =>
    rolActual === 'OPERADOR' ? 'registro' : 'dashboard'

  const destinoInicial = (rolActual) => {
    const param = new URLSearchParams(window.location.search).get('modulo')
    return MODULOS.find((item) => item.id === param && item.roles.includes(rolActual))?.id
      || destinoPorDefecto(rolActual)
  }

  useEffect(() => {
    if (!sesion) return undefined
    const permitido = MODULOS.find(
      (item) => item.id === activo && item.roles.includes(sesion.usuario.rol)
    )
    if (!permitido) {
      setActivo(destinoPorDefecto(sesion.usuario.rol))
    }
    return undefined
  }, [sesion, activo, rol])

  const handleLogin = async (data) => {
    setToken(data.token)
    setSesion({ usuario: data.usuario, token: data.token })
    setAvisoSesion('')
    setActivo(destinoInicial(data.usuario.rol))
  }

  const handleLogout = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      return
    }
    setPerfilAbierto(false)
    try {
      await api.auth.logout()
    } catch {
      // El token ya puede estar inválido: igual salimos de la app.
    }
    setToken('')
    setSesion(null)
    setAvisoSesion('')
    setActivo('registro')
  }

  const navegar = (id) => {
    const destino = MODULOS.find((item) => item.id === id)
    if (destino && (esAdmin || destino.roles.includes(rol))) {
      setActivo(id)
    }
  }

  if (comprobando) {
    return (
      <div className="boot-screen" role="status">
        <Icon name="leaf" size={26} />
        <p>Verificando tu sesión...</p>
      </div>
    )
  }

  if (!sesion) {
    return <Login onLogin={handleLogin} aviso={avisoSesion} />
  }

  const usuario = sesion.usuario
  const soloLectura = rol !== 'OPERADOR'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="leaf" size={21} /></span>
          <div>
            <strong>EcoChain</strong>
            <small>Auditoría de merma</small>
          </div>
        </div>

        <nav className="nav" aria-label="Módulos de EcoChain">
          <p className="sidebar-eyebrow">Módulos</p>
          {visibles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activo === item.id ? 'active' : ''}`}
              onClick={() => setActivo(item.id)}
              aria-current={activo === item.id ? 'page' : undefined}
            >
              <Icon name={item.icono} size={18} />
              <span>{item.nav}</span>
            </button>
          ))}

          {/* Perfil del usuario (móvil: dentro de la barra flotante) */}
          {perfilAbierto ? (
            <div className="nav-item user-item">
              <button
                type="button"
                className="bar-action bar-action-logout"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <Icon name="doorOpen" size={16} />
              </button>
              <button
                type="button"
                className="bar-action bar-action-cancel"
                onClick={() => setPerfilAbierto(false)}
                aria-label="Cancelar"
              >
                <Icon name="arrowLeft" size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="nav-item user-item"
              onClick={() => setPerfilAbierto(true)}
              aria-expanded={perfilAbierto}
              aria-label="Abrir el perfil del usuario"
            >
              <Icon name="user" size={16} />
              <span>Perfil</span>
            </button>
          )}
        </nav>

        <div className="sidebar-foot">
          {/* <p className="sidebar-eyebrow">Sesión activa</p> */}
          <div className="user-row">
            <span className="user-avatar">{iniciales(usuario.nombre)}</span>
            <span className="user-name-block">
              <strong>{usuario.nombre}</strong>
              <small>{esAdmin ? 'Administrador' : 'Operador'}</small>
            </span>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={15} />
            Cerrar sesión
          </button>
          {/* <p className="role-hint">
            El rol decide qué módulos ves y qué puedes crear, editar o eliminar.
          </p> */}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">EcoChain / {modulo.nav}</p>
            <h1>{modulo.titulo}</h1>
            <p className="topbar-sub">{modulo.subtitulo}</p>
          </div>
          <div className="topbar-meta">
            <span className="topbar-date">
              <Icon name="calendar" size={15} />
              {fechaLarga}
            </span>
            {/* <span className="role-chip">{esAdmin ? 'Administrador' : 'Operador'}</span> */}
          </div>
        </header>

        <main className="content">
          {activo === 'dashboard' && <Dashboard onNavigate={navegar} />}
          {activo === 'registro' && <Registro soloLectura={soloLectura} />}
          {activo === 'catalogos' && <Catalogos />}
          {activo === 'envios' && <Envios />}
        </main>
      </div>
    </div>
  )
}
