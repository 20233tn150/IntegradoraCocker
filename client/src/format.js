const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

export const currentYear = new Date().getFullYear()

export const todayISO = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export const fmtMoney = (value) => money.format(Number(value ?? 0))

export const fmtKg = (value) => `${number.format(Number(value ?? 0))} kg`

export const fmtNumber = (value) => number.format(Number(value ?? 0))

export const fmtPct = (value) => `${Number(value ?? 0).toFixed(1)}%`

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export const fmtCompact = (value) => {
  const n = Number(value ?? 0)
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${Math.round(n)}`
}

export const MOTIVOS = [
  { value: 'FALLA_CALIBRACION', label: 'Falla de calibración' },
  { value: 'CORTE_DEFECTUOSO', label: 'Corte defectuoso' },
  { value: 'MATERIAL_CADUCADO', label: 'Material caducado' },
  { value: 'ERROR_OPERACION', label: 'Error de operación' },
  { value: 'CONTAMINACION', label: 'Contaminación' },
  { value: 'OTRO', label: 'Otro' }
]

export const MOTIVO_LABEL = Object.fromEntries(
  MOTIVOS.map((motivo) => [motivo.value, motivo.label])
)

export const ESTADOS = [
  { value: 'EN_ALMACEN', label: 'En almacén' },
  { value: 'ENVIADO', label: 'Enviado' }
]

export const ESTADO_LABEL = Object.fromEntries(
  ESTADOS.map((estado) => [estado.value, estado.label])
)

export const TIPOS_AREA = [
  { value: 'AREA', label: 'Área' },
  { value: 'MAQUINA', label: 'Máquina' }
]
