const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const TOKEN_KEY = 'ecochain-token'

let token = window.localStorage.getItem(TOKEN_KEY) || ''
let handlerDeSesionTerminada = () => {}

export function setToken(nuevoToken) {
  token = nuevoToken || ''
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function getToken() {
  return token
}

export function onSesionTerminada(fn) {
  handlerDeSesionTerminada = fn
}

function query(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined
  )
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options
  })

  if (res.status === 204) return null

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (res.status === 401 && !String(path).startsWith('/auth/login')) {
    handlerDeSesionTerminada()
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Error HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  onSesionTerminada,

  auth: {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' })
  },

  dashboard: (anio) => request(`/dashboard?anio=${anio}`),

  lotes: {
    list: (filtros) => request(`/lotes${query(filtros)}`),
    anios: () => request('/lotes/anios'),
    disponibles: () => request('/lotes/disponibles'),
    create: (body) => request('/lotes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/lotes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/lotes/${id}`, { method: 'DELETE' })
  },

  materiales: {
    list: () => request('/materiales'),
    create: (body) => request('/materiales', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/materiales/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/materiales/${id}`, { method: 'DELETE' })
  },

  areas: {
    list: () => request('/areas'),
    create: (body) => request('/areas', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/areas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/areas/${id}`, { method: 'DELETE' })
  },

  envios: {
    list: () => request('/envios'),
    create: (body) => request('/envios', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/envios/${id}`, { method: 'DELETE' })
  }
}
