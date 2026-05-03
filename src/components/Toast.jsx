import { useState, useEffect, useCallback } from 'react'

const css = `
  .toast-stack {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
  }

  .toast-item {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: rgba(255,255,255,0.82);
    background: rgba(22,24,32,0.96);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 10px 18px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    pointer-events: auto;
    white-space: nowrap;
    animation: toastIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  .toast-item.out {
    animation: toastOut 0.2s ease forwards;
  }

  .toast-item.error {
    border-color: rgba(248,113,113,0.2);
    color: #FCA5A5;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(6px) scale(0.97); }
  }
`

let _id = 0

export default function Toast() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  useEffect(() => {
    function handler(e) {
      const { message, type = 'default' } = e.detail
      const id = ++_id
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    }
    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [dismiss])

  return (
    <>
      <style>{css}</style>
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item${t.type === 'error' ? ' error' : ''}${t.out ? ' out' : ''}`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}

export function toast(message, type = 'default') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }))
}
