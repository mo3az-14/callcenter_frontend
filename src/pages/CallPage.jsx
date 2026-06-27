import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ESCALATION_CLEAR_MS } from '../config.js'
import { subscribeCallEvents } from '../api/call.js'
import { Brand, Orb, stateLine } from '../components/Orb.jsx'
import { Mic, TextIcon } from '../components/Icons.jsx'
import TextChat from '../components/TextChat.jsx'
import VoiceCall from '../components/VoiceCall.jsx'

function BgRadial() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 55%, var(--c-glow-2) 0%, transparent 55%)',
    }}/>
  )
}

function DetailsPanel({ open, setOpen, agentState, elapsed, events }) {
  const fmt = (s) => {
    const m = Math.floor(s / 60), ss = s % 60, h = Math.floor(m / 60)
    return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  if (!open) {
    return (
      <button className="chip" style={{
        position: 'fixed', right: 20, bottom: 20, cursor: 'pointer',
        background: 'rgba(20,23,28,0.6)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--line)', color: 'var(--fg-3)',
      }} onClick={() => setOpen(true)}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--c)', boxShadow: '0 0 6px var(--c)' }}/>
        details <span className="kbd" style={{ marginLeft: 4 }}>D</span>
      </button>
    )
  }

  return (
    <div className="fade-up" style={{
      position: 'fixed', right: 20, bottom: 20,
      width: 320,
      background: 'rgba(12,14,17,0.78)', backdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid var(--line-2)', borderRadius: 14,
      padding: 14, boxShadow: '0 18px 48px rgba(0,0,0,0.5)',
      color: 'var(--fg)', display: 'flex', flexDirection: 'column', gap: 10,
      zIndex: 50,
    }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          session details
        </span>
        <button onClick={() => setOpen(false)} style={{ appearance: 'none', background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
      </div>

      {[
        { k: 'agent', v: agentState, accent: true },
        { k: 'elapsed', v: fmt(elapsed) },
        { k: 'connection', v: 'livekit · webrtc' },
      ].map(({ k, v, accent }) => (
        <div key={k} className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, gap: 14 }}>
          <span style={{ color: 'var(--fg-3)' }}>{k}</span>
          <span style={{ color: accent ? 'var(--c)' : 'var(--fg)' }}>{v}</span>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflowY: 'auto' }}>
        <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>event log</span>
        {(events || []).slice(-6).map((e, i) => (
          <div key={i} className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', gap: 10 }}>
            <span style={{ color: 'var(--fg-4)', flex: '0 0 28px' }}>+{String(e.t).padStart(2,'0')}s</span>
            <span style={{ color: 'var(--fg-3)', flex: '0 0 56px' }}>{e.k}</span>
            <span style={{ color: 'var(--c)' }}>{e.v}</span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>
        press <span className="kbd">D</span> to toggle
      </div>
    </div>
  )
}

function EscalationOverlay({ onClose }) {
  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'radial-gradient(circle at 50% 50%, rgba(8,9,11,0.85) 0%, rgba(8,9,11,0.98) 60%)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 32, padding: 24,
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 56 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 28%, #ffffff 0%, var(--c) 30%, var(--c-dim) 80%)',
          boxShadow: '0 0 50px var(--c-glow)',
          animation: 'breathe 1.6s ease-in-out infinite',
        }}/>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
          handing off
        </div>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 28%, #ffffff 0%, var(--amber) 30%, #b8895a 80%)',
          boxShadow: '0 0 50px var(--amber-glow)',
          animation: 'breathe 1.6s ease-in-out 0.8s infinite',
        }}/>
        <div style={{
          position: 'absolute', left: 96, right: 96, top: '50%',
          height: 1, background: 'linear-gradient(to right, var(--c) 0%, var(--amber) 100%)',
          opacity: 0.5,
        }}/>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
        <div className="display" style={{ fontSize: 'clamp(34px, 6vh, 52px)', lineHeight: 1 }}>
          Getting you to <span style={{ fontStyle: 'italic', color: 'var(--amber)', whiteSpace: 'nowrap' }}>a person.</span>
        </div>
        <div style={{ color: 'var(--fg-3)', marginTop: 12, fontSize: 15.5 }}>
          They'll have the conversation so far. One moment.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 99,
            background: 'var(--c)',
            animation: `breathe 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}/>
        ))}
      </div>

      <button className="btn ghost sm" onClick={onClose} style={{ marginTop: 14, color: 'var(--fg-3)' }}>
        cancel transfer
      </button>
    </div>
  )
}

export default function CallPage() {
  const { role, email, logout } = useAuth()
  const navigate = useNavigate()
  const [callMode, setCallMode] = useState('voice')
  const [activeCallId, setActiveCallId] = useState(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [messages, setMessages] = useState([])
  const [agentState, setAgentState] = useState('listening')
  const [elapsed, setElapsed] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [eventLog, setEventLog] = useState([])
  const sseCleanupRef = useRef(null)

  // SSE subscription
  useEffect(() => {
    if (!activeCallId) return

    sseCleanupRef.current = subscribeCallEvents(activeCallId, {
      onEscalated: () => setIsEscalating(true),
      onEnded: () => {
        setActiveCallId(null)
        setMessages([])
      },
    })

    return () => {
      sseCleanupRef.current?.()
      sseCleanupRef.current = null
    }
  }, [activeCallId])

  // D key toggles details panel
  useEffect(() => {
    function onKey(e) {
      if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target?.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        e.preventDefault()
        setShowDetails(s => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function handleAgentStateChange(state, t) {
    setAgentState(state)
    setEventLog(l => [...l, { t, k: 'agent', v: state }].slice(-12))
  }

  return (
    <div className="page">
      <div className="topbar">
        <Brand size={13}/>
        <div className="row gap-m" style={{ alignItems: 'center' }}>
          <div className="seg">
            <button className={callMode === 'voice' ? 'active' : ''} onClick={() => setCallMode('voice')}>
              <Mic size={12}/>&nbsp;Voice
            </button>
            <button className={callMode === 'text' ? 'active' : ''} onClick={() => setCallMode('text')}>
              <TextIcon size={12}/>&nbsp;Text
            </button>
          </div>
          <div className="row gap-s" style={{ alignItems: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
            {email && <span className="mono" style={{ fontSize: 11.5 }}>{email}</span>}
            <button className="btn ghost sm" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </div>

      {/* Both components stay mounted so a LiveKit voice call is not dropped
          when the user switches to the text tab. Visibility is controlled
          via display so their internal state and WebRTC connections survive. */}
      <div style={{ display: callMode === 'voice' ? 'contents' : 'none' }}>
        <VoiceCall
          isActive={callMode === 'voice'}
          activeCallId={activeCallId}
          onCallStarted={(id) => { setActiveCallId(id); setElapsed(0) }}
          onCallEnded={() => setActiveCallId(null)}
          agentState={isEscalating ? 'escalating' : agentState}
          onAgentStateChange={handleAgentStateChange}
          elapsed={elapsed}
          setElapsed={setElapsed}
          isEscalating={isEscalating}
        />
      </div>
      <div style={{ display: callMode === 'text' ? 'contents' : 'none' }}>
        <TextChat
          isActive={callMode === 'text'}
          activeCallId={activeCallId}
          onCallStarted={setActiveCallId}
          onCallEnded={() => { setActiveCallId(null); setMessages([]) }}
          disabled={isEscalating}
          messages={messages}
          setMessages={setMessages}
        />
      </div>

      {callMode === 'voice' && activeCallId && (
        <DetailsPanel
          open={showDetails}
          setOpen={setShowDetails}
          agentState={agentState}
          elapsed={elapsed}
          events={eventLog}
        />
      )}

      {isEscalating && <EscalationOverlay onClose={() => setIsEscalating(false)}/>}
    </div>
  )
}
