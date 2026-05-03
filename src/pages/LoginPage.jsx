import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { signup as apiSignup, login as apiLogin } from '../api/auth.js'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .lp-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #080A0F;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .lp-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(45,212,191,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(45,212,191,0.025) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none;
  }

  .lp-glow {
    position: absolute;
    width: 640px;
    height: 640px;
    background: radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .lp-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
    margin: 20px;
    padding: 40px;
    background: rgba(13,15,22,0.92);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    box-shadow: 0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,212,191,0.04);
    animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lp-brand {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 21px;
    color: #F1F5F9;
    letter-spacing: -0.03em;
  }

  .lp-tagline {
    font-size: 12.5px;
    font-weight: 300;
    color: rgba(255,255,255,0.3);
    margin-left: 38px;
    margin-top: 4px;
    letter-spacing: 0.01em;
  }

  .lp-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 28px 0;
  }

  .lp-toggle {
    display: flex;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 28px;
  }

  .lp-toggle-btn {
    flex: 1;
    padding: 9px 0;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.35);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
  }

  .lp-toggle-btn.active {
    background: rgba(45,212,191,0.1);
    color: #2DD4BF;
  }

  .lp-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }

  .lp-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 9px;
    padding: 12px 14px;
    color: #F1F5F9;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .lp-input::placeholder { color: rgba(255,255,255,0.2); }

  .lp-input:focus {
    border-color: rgba(45,212,191,0.45);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.07);
  }

  .lp-name-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    animation: fieldIn 0.25s ease forwards;
  }

  @keyframes fieldIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lp-error {
    font-size: 13px;
    color: #FCA5A5;
    padding: 10px 13px;
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.15);
    border-radius: 8px;
  }

  .lp-submit {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #2DD4BF 0%, #0EA5E9 100%);
    border: none;
    border-radius: 9px;
    color: #070A0F;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .lp-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .lp-submit:active:not(:disabled) { transform: translateY(0); }
  .lp-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  .lp-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(7,10,15,0.25);
    border-top-color: #070A0F;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/call" replace />

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
        ? await apiSignup(email, password, firstName, lastName)
        : await apiLogin(email, password)

      const token = data.access_token
      const userId = data.user_id
      const roleId = JSON.parse(atob(token.split('.')[1])).role_id
      login(token, userId, roleId)
      navigate('/call')
    } catch (err) {
      const status = err.response?.status
      if (status === 400) setError('This email is already registered')
      else if (status === 401) setError('Incorrect email or password')
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="lp-root">
        <div className="lp-grid" />
        <div className="lp-glow" />

        <div className="lp-card">
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <circle cx="13" cy="13" r="12" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.35" />
              <path d="M6 13 Q9.5 7 13 13 Q16.5 19 20 13" stroke="#2DD4BF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="lp-brand">CallCenter</span>
          </div>
          <p className="lp-tagline">AI-powered support, instantly</p>

          <div className="lp-divider" />

          {/* Mode toggle */}
          <div className="lp-toggle" role="group" aria-label="Authentication mode">
            <button type="button" className={`lp-toggle-btn${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
              Log in
            </button>
            <button type="button" className={`lp-toggle-btn${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div className="lp-name-row">
                <div>
                  <label className="lp-label" htmlFor="firstName">First name</label>
                  <input id="firstName" className="lp-input" type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="lp-label" htmlFor="lastName">Last name</label>
                  <input id="lastName" className="lp-input" type="text" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
            )}

            <div>
              <label className="lp-label" htmlFor="email">Email</label>
              <input id="email" className="lp-input" type="email" placeholder="jane@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="lp-label" htmlFor="password">Password</label>
              <input id="password" className="lp-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && <p className="lp-error" role="alert">{error}</p>}

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading && <span className="lp-spinner" aria-hidden="true" />}
              {loading
                ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
