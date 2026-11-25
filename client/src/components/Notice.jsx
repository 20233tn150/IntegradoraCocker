import Icon from './Icons.jsx'

export default function Notice({ type = 'info', children, onClose }) {
  if (!children) return null

  return (
    <div className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={type === 'error' ? 'alert' : 'check'} size={18} />
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          className="notice-close"
          onClick={onClose}
          aria-label="Cerrar aviso"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  )
}
