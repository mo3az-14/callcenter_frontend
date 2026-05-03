import { useState, useEffect, useRef } from 'react'
import { startCall, endCall, getCurrentCall } from '../api/call.js'
import { respond } from '../api/turns.js'

const css = `
  .tc-root {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  .tc-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.07) transparent;
  }

  .tc-messages::-webkit-scrollbar { width: 4px; }
  .tc-messages::-webkit-scrollbar-track { background: transparent; }
  .tc-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }

  .tc-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.16);
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.01em;
  }

  .tc-row {
    display: flex;
    gap: 10px;
    animation: msgIn 0.22s ease forwards;
  }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .tc-row.user { justify-content: flex-end; }
  .tc-row.ai   { justify-content: flex-start; align-items: flex-end; }

  .tc-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 700;
    color: #2DD4BF;
    letter-spacing: 0.04em;
  }

  .tc-bubble {
    max-width: 65%;
    padding: 11px 15px;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
  }

  .tc-bubble.user {
    background: linear-gradient(135deg, #2DD4BF, #0EA5E9);
    color: #070A0F;
    font-weight: 400;
    border-radius: 16px 16px 4px 16px;
  }

  .tc-bubble.ai {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.82);
    font-weight: 300;
    border-radius: 16px 16px 16px 4px;
  }

  .tc-bubble.error-bubble {
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.14);
    color: #FCA5A5;
    font-size: 13px;
    border-radius: 16px 16px 16px 4px;
  }

  .tc-typing {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 14px 16px;
  }

  .tc-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(45,212,191,0.45);
    animation: dotBounce 1.2s ease-in-out infinite;
  }
  .tc-dot:nth-child(2) { animation-delay: 0.18s; }
  .tc-dot:nth-child(3) { animation-delay: 0.36s; }

  @keyframes dotBounce {
    0%, 100% { transform: scale(0.7); opacity: 0.35; }
    50%       { transform: scale(1);   opacity: 1; }
  }

  .tc-footer {
    padding: 12px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #080A0F;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .tc-footer-meta {
    display: flex;
    justify-content: flex-end;
  }

  .tc-end-btn {
    font-size: 11.5px;
    font-weight: 500;
    color: rgba(248,113,113,0.55);
    background: none;
    border: 1px solid rgba(248,113,113,0.13);
    border-radius: 6px;
    padding: 5px 13px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .tc-end-btn:hover:not(:disabled) {
    color: #FCA5A5;
    border-color: rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.04);
  }

  .tc-end-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .tc-input-row {
    display: flex;
    gap: 9px;
    align-items: center;
  }

  .tc-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 15px;
    color: #F1F5F9;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .tc-input::placeholder { color: rgba(255,255,255,0.18); }

  .tc-input:focus {
    border-color: rgba(45,212,191,0.38);
    box-shadow: 0 0 0 3px rgba(45,212,191,0.055);
  }

  .tc-input:disabled { opacity: 0.35; cursor: not-allowed; }

  .tc-send-btn {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #2DD4BF, #0EA5E9);
    color: #070A0F;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s, transform 0.15s;
  }

  .tc-send-btn:hover:not(:disabled) { opacity: 0.82; transform: scale(1.06); }
  .tc-send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .tc-state-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .tc-spinner {
    width: 16px;
    height: 16px;
    border: 1.5px solid rgba(45,212,191,0.15);
    border-top-color: #2DD4BF;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }

  .tc-state-label {
    font-size: 13px;
    font-weight: 300;
    color: rgba(255,255,255,0.28);
    letter-spacing: 0.01em;
  }

  .tc-start-err {
    font-size: 13px;
    color: #FCA5A5;
    padding: 11px 16px;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.14);
    border-radius: 8px;
    text-align: center;
    max-width: 340px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`

export default function TextChat({ activeCallId, onCallStarted, onCallEnded, disabled, messages, setMessages }) {
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
    if (activeCallId != null) return
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
          // Active call already exists — recover it silently instead of erroring
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
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleEndAndRetry() {
    setEndingConflict(true)
    try {
      const current = await getCurrentCall()
      await endCall(current.call_id)
    } catch { /* swallow — proceed to retry regardless */ }
    setEndingConflict(false)
    setHasConflict(false)
    setStartError('')
    // Re-trigger the start flow
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
    e.preventDefault()
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
    try { await endCall(activeCallId) } catch { /* swallow */ }
    setEnding(false)
    onCallEnded()
  }

  const inputDisabled = disabled || pending || !activeCallId

  return (
    <>
      <style>{css}</style>
      <div className="tc-root">
        {starting && (
          <div className="tc-state-center">
            <div className="tc-spinner" aria-hidden="true" />
            <span className="tc-state-label">Starting session…</span>
          </div>
        )}

        {!starting && startError && (
          <div className="tc-state-center" style={{ gap: '14px' }}>
            <p className="tc-start-err" role="alert">{startError}</p>
            {hasConflict && (
              <button
                onClick={handleEndAndRetry}
                disabled={endingConflict}
                style={{
                  padding: '9px 20px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: '8px',
                  color: '#FCA5A5',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: endingConflict ? 'not-allowed' : 'pointer',
                  opacity: endingConflict ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {endingConflict ? 'Ending call…' : 'End active call and retry'}
              </button>
            )}
          </div>
        )}

        {!starting && !startError && (
          <>
            <div className="tc-messages" role="log" aria-live="polite">
              {messages.length === 0 && (
                <div className="tc-empty">Session started — ask anything.</div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`tc-row ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="tc-avatar" aria-hidden="true">AI</div>
                  )}
                  <div className={`tc-bubble ${msg.role}${msg.error ? ' error-bubble' : ''}`}>
                    {msg.typing ? (
                      <div className="tc-typing" aria-label="AI is typing">
                        <div className="tc-dot" />
                        <div className="tc-dot" />
                        <div className="tc-dot" />
                      </div>
                    ) : msg.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <footer className="tc-footer">
              <div className="tc-footer-meta">
                <button
                  className="tc-end-btn"
                  onClick={handleEnd}
                  disabled={!activeCallId || ending || disabled}
                >
                  {ending ? 'Ending…' : 'End session'}
                </button>
              </div>
              <form className="tc-input-row" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  className="tc-input"
                  type="text"
                  placeholder={disabled ? 'Session paused…' : 'Type a message…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={inputDisabled}
                  aria-label="Message input"
                />
                <button
                  type="submit"
                  className="tc-send-btn"
                  disabled={inputDisabled || !input.trim()}
                  aria-label="Send message"
                >
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M2 8.5H15M9.5 2.5L15 8.5L9.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </footer>
          </>
        )}
      </div>
    </>
  )
}
