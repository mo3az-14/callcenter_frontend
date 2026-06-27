export function Mic({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3"/>
      <path d="M5 11a7 7 0 0014 0M12 18v3"/>
    </svg>
  )
}

export function MicOff({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3"/>
      <path d="M5 11a7 7 0 0014 0M12 18v3M3 3l18 18"/>
    </svg>
  )
}

export function HangUp({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 14a9 9 0 0118 0v2l-4 .5v-3a11 11 0 00-10 0v3L3 16z"
            transform="rotate(135 12 12)"/>
    </svg>
  )
}

export function TextIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h10"/>
    </svg>
  )
}

export function Send({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11l18-8-8 18-2-8-8-2z" opacity="0.95"/>
    </svg>
  )
}

export function PlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  )
}

export function FileIcon({ name }) {
  const ext = (name || '').split('.').pop().toLowerCase()
  const col = { pdf: '#ef5350', docx: '#5c8df0', xlsx: '#6ed09c', csv: '#f0c674' }[ext] || 'var(--fg-3)'
  return (
    <div style={{ width: 30, height: 36, position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-2)', border: '1px solid var(--line-2)',
        borderRadius: 4,
      }}/>
      <div style={{
        position: 'absolute', bottom: 4, left: 3, right: 3,
        fontFamily: 'var(--mono)', fontSize: 8.5, fontWeight: 600,
        color: col, textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {ext}
      </div>
    </div>
  )
}
