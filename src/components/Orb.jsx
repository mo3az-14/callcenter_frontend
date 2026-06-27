import brandLogo from '../assets/grad_project_logo.webp'

export const STATE_COPY = {
  idle:          'ready when you are',
  connecting:    'connecting',
  listening:     "i'm listening",
  user_speaking: 'go ahead',
  speaking:      'one sec…',
  thinking:      'thinking',
  escalating:    'finding someone',
}

export function stateLine(state) {
  return STATE_COPY[state] || state
}

function Particles({ size }) {
  const pts = [
    { x: 0.18, y: 0.30, d: 0 },
    { x: 0.82, y: 0.42, d: 0.4 },
    { x: 0.28, y: 0.78, d: 0.8 },
    { x: 0.72, y: 0.18, d: 1.2 },
    { x: 0.86, y: 0.74, d: 1.6 },
    { x: 0.12, y: 0.62, d: 2 },
  ]
  return (
    <>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.x * size, top: p.y * size,
          width: 3, height: 3, borderRadius: '50%',
          background: 'var(--c)',
          boxShadow: '0 0 8px var(--c)',
          opacity: 0.5,
          animation: `drift ${3 + (i % 3)}s ease-in-out ${p.d}s infinite`,
        }}/>
      ))}
    </>
  )
}

export function Orb({ state = 'idle', size = 280 }) {
  const escalating = state === 'escalating'
  const speaking   = state === 'speaking'
  const listening  = state === 'listening'
  const thinking   = state === 'thinking'
  const idle       = state === 'idle'

  const coreColor = escalating
    ? 'linear-gradient(135deg, var(--c) 0%, var(--amber) 100%)'
    : 'radial-gradient(circle at 35% 28%, #ffffff 0%, var(--c) 18%, var(--c) 38%, var(--c-dim) 70%, transparent 100%)'

  const haloColor = escalating
    ? 'radial-gradient(circle, var(--amber-glow) 0%, transparent 60%)'
    : 'radial-gradient(circle, var(--c-glow) 0%, transparent 60%)'

  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: haloColor,
        filter: 'blur(28px)',
        animation: speaking ? 'haloPulse 0.9s ease-in-out infinite'
                 : listening ? 'haloPulse 2.4s ease-in-out infinite'
                 : 'haloPulse 4s ease-in-out infinite',
        opacity: idle ? 0.45 : 0.85,
      }}/>
      <div style={{
        position: 'absolute', inset: '8%', borderRadius: '50%',
        border: '1px dashed var(--c-dim)',
        opacity: idle ? 0.2 : 0.45,
        animation: thinking ? 'ringRotate 6s linear infinite' : 'none',
      }}/>
      <div style={{
        position: 'absolute', inset: '18%', borderRadius: '50%',
        border: '1px solid var(--c-glow)',
        opacity: 0.5,
        animation: listening ? 'breathe 2.4s ease-in-out infinite' : 'none',
      }}/>
      <div style={{
        width: size * 0.52, height: size * 0.52,
        borderRadius: '50%',
        background: coreColor,
        backgroundSize: speaking ? '200% 200%' : '100% 100%',
        boxShadow: `
          0 0 60px ${escalating ? 'var(--amber-glow)' : 'var(--c-glow)'},
          0 0 100px ${escalating ? 'var(--amber-glow)' : 'var(--c-glow-2)'},
          inset 0 0 24px rgba(255,255,255,0.18),
          inset 0 -18px 32px ${escalating ? 'rgba(240,198,116,0.25)' : 'rgba(46,134,121,0.4)'}
        `,
        animation: speaking ? 'breathe 0.7s ease-in-out infinite, shimmer 2.4s ease-in-out infinite'
                 : listening ? 'breathe 2s ease-in-out infinite'
                 : thinking  ? 'breathe 1.4s ease-in-out infinite'
                 : 'breathe 3.6s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }}/>
      {speaking && <Particles size={size}/>}
    </div>
  )
}

export function Brand({ size = 16, faded = false }) {
  const op = faded ? 0.55 : 1
  return (
    <img
      src={brandLogo}
      alt="ai · callcenter"
      style={{ height: size * 2.4, width: 'auto', display: 'inline-block', opacity: op }}
    />
  )
}
