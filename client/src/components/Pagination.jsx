import { useMemo, useState } from 'react'
import Icon from './Icons.jsx'

export const PAGE_SIZE = 10

/** Hook reutilizable de paginación.
 *  Recibe el array completo; devuelve la página actual + controles. */
export function usePagination(items) {
  const [pagina, setPagina] = useState(1)

  const total = items.length
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginaReal = Math.min(pagina, totalPaginas)

  const slice = useMemo(() => {
    const inicio = (paginaReal - 1) * PAGE_SIZE
    return items.slice(inicio, inicio + PAGE_SIZE)
  }, [items, paginaReal])

  const ir = (n) => setPagina(Math.max(1, Math.min(n, totalPaginas)))
  const reset = () => setPagina(1)

  return { slice, pagina: paginaReal, totalPaginas, total, ir, reset }
}

/** Controles de paginación. No renderiza nada si hay una sola página. */
export default function Pagination({ pagina, totalPaginas, total, ir }) {
  if (totalPaginas <= 1) return null

  const inicio = (pagina - 1) * PAGE_SIZE + 1
  const fin = Math.min(pagina * PAGE_SIZE, total)

  const pages = useMemo(() => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    const rango = []
    rango.push(1)
    if (pagina > 3) rango.push('...')
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) {
      rango.push(i)
    }
    if (pagina < totalPaginas - 2) rango.push('...')
    rango.push(totalPaginas)
    return rango
  }, [pagina, totalPaginas])

  return (
    <div className="pagination">
      <span className="pagination-info">{inicio}–{fin} de {total}</span>

      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={pagina === 1}
          onClick={() => ir(pagina - 1)}
          aria-label="Página anterior"
        >
          <span style={{ display: 'flex', transform: 'rotate(180deg)' }}>
            <Icon name="chevron" size={13} strokeWidth={2.2} />
          </span>
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`e${idx}`} className="page-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === pagina ? ' active' : ''}`}
              onClick={() => ir(p)}
              aria-label={`Página ${p}`}
              aria-current={p === pagina ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-btn"
          disabled={pagina === totalPaginas}
          onClick={() => ir(pagina + 1)}
          aria-label="Página siguiente"
        >
          <Icon name="chevron" size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
