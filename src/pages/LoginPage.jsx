import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { signup as apiSignup, login as apiLogin } from '../api/auth.js'
import { Orb, Brand } from '../components/Orb.jsx'

export default function LoginPage() {
  const { isAuthenticated, login, role } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ first: '', last: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to={role === 'admin' ? '/upload' : '/call'} replace />

  // FastAPI returns `detail` as a string, or an array of { msg } for validation (422) errors.
  function detailMessage(detail) {
    if (typeof detail === 'string' && detail) return detail
    if (Array.isArray(detail)) {
      const msgs = detail.map(d => d?.msg).filter(Boolean)
      if (msgs.length) return msgs.join(' ')
    }
    return ''
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = mode === 'signup'
        ? await apiSignup(form.email, form.password, form.first, form.last)
        : await apiLogin(form.email, form.password)

      login(data.access_token, data.user_id, data.role, form.email)
      navigate(data.role === 'admin' ? '/upload' : '/call')
    } catch (err) {
      const status = err.response?.status
      const message = detailMessage(err.response?.data?.detail)
      if (!err.response) setError("Can't reach the server. Check your connection and try again.")
      else if (message) setError(message)
      else if (status === 400) setError('This email is already registered.')
      else if (status === 401 || status === 403 || status === 404 || status === 422)
        setError(mode === 'login'
          ? "No account matches that email and password. Check your details or sign up."
          : 'Please check your details and try again.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(360px, 1.1fr) minmax(420px, 1fr)',
      minHeight: '100vh',
    }}>
      {/* ── Left: orb hero ── */}
      <div style={{
        background: 'var(--bg)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '32px 36px',
        borderRight: '1px solid var(--line)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 65%, var(--c-glow-2) 0%, transparent 60%)',
        }}/>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.35,
          background: 'radial-gradient(var(--line-2) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Brand size={13}/>
        </div>

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Orb state="listening" size={380}/>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
          <div className="display" style={{ fontSize: 38, lineHeight: 1.05, color: 'var(--fg)', marginBottom: 14 }}>
            Voice support<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--c)' }}>that actually listens.</span>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            real conversations &nbsp;·&nbsp; live human hand-off &nbsp;·&nbsp; sub-200ms
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div style={{
        background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 56px', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'New here? Create account →' : 'Have an account? Sign in →'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="fade-up" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', maxWidth: 380, gap: 22,
          margin: '0 auto', width: '100%',
        }}>
          <div>
            <div className="display" style={{ fontSize: 40, lineHeight: 1 }}>
              {mode === 'login' ? 'Welcome back.' : "Let's get you set up."}
            </div>
            <div style={{ color: 'var(--fg-3)', marginTop: 8, fontSize: 14.5 }}>
              {mode === 'login'
                ? 'Sign in to pick up where you left off.'
                : "Three quick details and you're in."}
            </div>
          </div>

          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Log in</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span className="field-label">First name</span>
                  <div className="field">
                    <input autoFocus placeholder="Ada" value={form.first} onChange={e => setForm({ ...form, first: e.target.value })} required/>
                  </div>
                </div>
                <div>
                  <span className="field-label">Last name</span>
                  <div className="field">
                    <input placeholder="Lovelace" value={form.last} onChange={e => setForm({ ...form, last: e.target.value })} required/>
                  </div>
                </div>
              </div>
            )}
            <div>
              <span className="field-label">Email</span>
              <div className="field">
                <input type="email" placeholder="you@where.com" autoFocus={mode === 'login'}
                       value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required/>
              </div>
            </div>
            <div>
              <span className="field-label">Password</span>
              <div className="field">
                <input type="password" placeholder="••••••••••"
                       value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required/>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', fontSize: 13.5,
              background: 'rgba(239,83,80,0.08)',
              border: '1px solid rgba(239,83,80,0.3)',
              borderRadius: 10, color: 'var(--danger)',
            }} role="alert">{error}</div>
          )}

          <button type="submit" className="btn primary lg" disabled={loading}
                  style={{ justifyContent: 'center', width: '100%', marginTop: 6 }}>
            {loading ? 'one moment…' : (mode === 'login' ? 'Log in →' : 'Create my account →')}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-4)' }}>
          <span>© 2026 · ai · callcenter</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--fg-4)', cursor: 'default' }}>Terms</span>
            <span style={{ color: 'var(--fg-5)' }}>·</span>
            <span style={{ color: 'var(--fg-4)', cursor: 'default' }}>Privacy</span>
          </span>
        </div>
      </div>
    </div>
  )
}
