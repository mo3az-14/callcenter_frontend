import { useState, useEffect, useRef } from 'react'
import { startCall, endCall, getCurrentCall } from '../api/call.js'
import { respond } from '../api/turns.js'
import { Send } from '../components/Icons.jsx'

function BgRadial() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 30%, var(--c-tint) 0%, transparent 60%)',
    }}/>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--c)',
          animation: `breathe 1s ease-in-out ${i * 0.16}s infinite`,
        }}/>
      ))}
    </div>
  )
}

function Msg({ role, text, typing }) {
  return (
    <div className="fade-up" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {role === 'ai' ? 'agent' : 'you'}
      </div>
      {typing
        ? <TypingDots/>
        : <div style={{ fontSize: 16.5, lineHeight: 1.4, color: role === 'ai' ? 'var(--fg)' : 'var(--fg-2)' }}>
            {text}
          </div>
      }
    </div>
  )
}

export default function TextChat({ isActive, activeCallId, onCallStarted, onCallEnded, disabled, messages, setMessages }) {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [hasConflict, setHasConflict] = useState(false)
  const [endingConflict, setEndingConflict] = useState(false)
  const [ending, setEnding] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Only auto-start a text session when the text tab is actually visible and
    // there is no call already in progress (e.g. an ongoing voice call).
    if (!isActive || activeCallId != null) return
    let cancelled = false
    setStarting(true)
    setStartError('')
    setHasConflict(false)

    async function initSession() {
      try {
        const data = await startCall()
        if (!cancelled) onCallStarted(data.call_id)
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 400) {
          try {
            const current = await getCurrentCall()
            if (!cancelled) onCallStarted(current.call_id)
          } catch {
            if (!cancelled) {
              setHasConflict(true)
              setStartError('You already have an active call.')
            }
          }
        } else {
          setStartError('Failed to start session. Please try again.')
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    }

    initSession()
    return () => { cancelled = true }
  }, [isActive])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleEndAndRetry() {
    setEndingConflict(true)
    try {
      const current = await getCurrentCall()
      await endCall(current.call_id)
    } catch {}
    setEndingConflict(false)
    setHasConflict(false)
    setStartError('')
    setStarting(true)
    try {
      const data = await startCall()
      onCallStarted(data.call_id)
    } catch (err) {
      if (err.response?.status === 400) {
        try {
          const current = await getCurrentCall()
          onCallStarted(current.call_id)
        } catch {
          setHasConflict(true)
          setStartError('You already have an active call.')
        }
      } else {
        setStartError('Failed to start session. Please try again.')
      }
    } finally {
      setStarting(false)
    }
  }

  async function handleSend(e) {
    e?.preventDefault()
    const query = input.trim()
    if (!query || pending || disabled || !activeCallId) return

    const typingId = `t-${Date.now()}`
    setInput('')
    setPending(true)
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: query },
      { id: typingId, role: 'ai', typing: true },
    ])

    try {
      const data = await respond(activeCallId, query)
      setMessages(prev => prev.map(m =>
        m.id === typingId ? { ...m, typing: false, text: data.response } : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === typingId ? { ...m, typing: false, text: 'Failed to get a response. Please try again.', error: true } : m
      ))
    } finally {
      setPending(false)
      inputRef.current?.focus()
    }
  }

  async function handleEnd() {
    if (!activeCallId || ending) return
    setEnding(true)
    try { await endCall(activeCallId) } catch {}
    setEnding(false)
    onCallEnded()
  }

  const inputDisabled = disabled || pending || !activeCallId

  if (starting) {
    return (
      <div className="grow center" style={{ flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 16, height: 16, border: '1.5px solid rgba(94,234,212,0.15)', borderTopColor: 'var(--c)', borderRadius: '50%', animation: 'ringRotate 0.65s linear infinite' }}/>
        <span className="mono" style={{ fontSize: 13, color: 'var(--fg-3)', fontWeight: 300, letterSpacing: '0.01em' }}>starting session…</span>
      </div>
    )
  }

  if (startError) {
    return (
      <div className="grow center" style={{ flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--danger)', padding: '11px 16px', background: 'rgba(239,83,80,0.06)', border: '1px solid rgba(239,83,80,0.14)', borderRadius: 8, textAlign: 'center', maxWidth: 340, margin: 0 }} role="alert">
          {startError}
        </p>
        {hasConflict && (
          <button className="btn danger sm" onClick={handleEndAndRetry} disabled={endingConflict}>
            {endingConflict ? 'Ending call…' : 'End active call and retry'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grow" style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', position: 'relative', overflow: 'hidden' }}>
      <BgRadial/>

      <div ref={bottomRef} style={{
        flex: 1, overflowY: 'auto', padding: '32px 0',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        maxWidth: 640, width: '100%', margin: '0 auto',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
      }}>
        <div className="col gap-l" style={{ paddingBottom: 16 }}>
          <div style={{ textAlign: 'center', color: 'var(--fg-4)' }}>
            <span className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              session started · just now
            </span>
          </div>
          {messages.map(msg => (
            <Msg key={msg.id} role={msg.role} text={msg.text} typing={msg.typing}/>
          ))}
        </div>
      </div>

      <div style={{
        padding: '16px 0 28px', position: 'relative', zIndex: 1,
        maxWidth: 640, width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div className="field" style={{ padding: '14px 18px', borderRadius: 16 }}>
          <input
            ref={inputRef}
            placeholder={disabled ? 'Session paused…' : 'Type your reply…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
            disabled={inputDisabled}
            style={{ fontSize: 15 }}
            aria-label="Message input"
          />
          <button className="btn primary sm" onClick={handleSend}
                  disabled={inputDisabled || !input.trim()}
                  style={{ padding: '8px 10px', borderRadius: 99, flexShrink: 0 }}>
            <Send size={12}/>
          </button>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', color: 'var(--fg-4)', fontSize: 12, alignItems: 'center', whiteSpace: 'nowrap', gap: 12 }}>
          <span>
            <span className="kbd">↵</span> send &nbsp;·&nbsp;
            <span className="kbd">⇧↵</span> newline
          </span>
          <button
            className="lnk"
            onClick={handleEnd}
            disabled={!activeCallId || ending || disabled}
            style={{ color: 'var(--fg-3)', background: 'none', border: 0, borderBottom: '1px solid var(--fg-5)', cursor: 'pointer', fontSize: 12, padding: 0 }}
          >
            {ending ? 'Ending…' : 'End session'}
          </button>
        </div>
      </div>
    </div>
  )
}
