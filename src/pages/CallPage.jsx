import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { UPLOAD_ADMIN_ROLE_ID, ESCALATION_POLL_MS, ESCALATION_CLEAR_MS } from '../config.js'
import { getCurrentCall } from '../api/call.js'
import TextChat from '../components/TextChat.jsx'
import VoiceCall from '../components/VoiceCall.jsx'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .cp-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #080A0F;
    display: flex;
    flex-direction: column;
    color: #F1F5F9;
  }

  .cp-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 60px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    background: rgba(8,10,15,0.96);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .cp-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 17px;
    color: #F1F5F9;
    letter-spacing: -0.02em;
  }

  .cp-topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cp-upload-link {
    font-size: 12px;
    font-weight: 500;
    color: rgba(45,212,191,0.7);
    text-decoration: none;
    padding: 5px 11px;
    border: 1px solid rgba(45,212,191,0.2);
    border-radius: 6px;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .cp-upload-link:hover {
    color: #2DD4BF;
    border-color: rgba(45,212,191,0.4);
    background: rgba(45,212,191,0.05);
  }

  .cp-logout-btn {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    background: none;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 6px;
    padding: 5px 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .cp-logout-btn:hover {
    color: rgba(255,255,255,0.65);
    border-color: rgba(255,255,255,0.18);
  }

  .cp-mode-bar {
    display: flex;
    justify-content: center;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
  }

  .cp-mode-toggle {
    display: flex;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 3px;
  }

  .cp-mode-btn {
    padding: 8px 32px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.3);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
  }

  .cp-mode-btn.active {
    background: rgba(45,212,191,0.1);
    color: #2DD4BF;
  }

  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }


  .cp-escalation-overlay {
    position: fixed;
    inset: 0;
    background: rgba(8,10,15,0.93);
    backdrop-filter: blur(14px);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    animation: overlayIn 0.3s ease;
  }

  @keyframes overlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .cp-escalation-pulse {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.25);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.18); opacity: 0.65; }
  }

  .cp-escalation-text {
    font-size: 15px;
    font-weight: 400;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.01em;
  }
`

export default function CallPage() {
  const { roleId, logout } = useAuth()
  const navigate = useNavigate()
  const [activeCallId, setActiveCallId] = useState(null)
  const [callMode, setCallMode] = useState('voice')
  const [isEscalating, setIsEscalating] = useState(false)
  const [messages, setMessages] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!activeCallId) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(async () => {
      try {
        await getCurrentCall()
      } catch (err) {
        if (err.response?.status === 404) {
          clearInterval(intervalRef.current)
          setActiveCallId(null)
          setMessages([])
          setIsEscalating(true)
          setTimeout(() => setIsEscalating(false), ESCALATION_CLEAR_MS)
        }
      }
    }, ESCALATION_POLL_MS)

    return () => clearInterval(intervalRef.current)
  }, [activeCallId])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <style>{css}</style>
      <div className="cp-root">
        <header className="cp-topbar">
          <div className="cp-brand">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="10" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.35" />
              <path d="M4.5 11 Q8 5.5 11 11 Q14 16.5 17.5 11" stroke="#2DD4BF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            CallCenter
          </div>
          <div className="cp-topbar-actions">
            {roleId >= UPLOAD_ADMIN_ROLE_ID && (
              <Link to="/upload" className="cp-upload-link">Upload</Link>
            )}
            <button className="cp-logout-btn" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <div className="cp-mode-bar">
          <div className="cp-mode-toggle" role="group" aria-label="Call mode">
            <button
              className={`cp-mode-btn${callMode === 'voice' ? ' active' : ''}`}
              onClick={() => setCallMode('voice')}
            >
              Voice
            </button>
            <button
              className={`cp-mode-btn${callMode === 'text' ? ' active' : ''}`}
              onClick={() => setCallMode('text')}
            >
              Text
            </button>
          </div>
        </div>

        <main className="cp-content">
          {callMode === 'text' ? (
            <TextChat
              activeCallId={activeCallId}
              onCallStarted={setActiveCallId}
              onCallEnded={() => { setActiveCallId(null); setMessages([]) }}
              disabled={isEscalating}
              messages={messages}
              setMessages={setMessages}
            />
          ) : (
            <VoiceCall
              activeCallId={activeCallId}
              onCallStarted={setActiveCallId}
              onCallEnded={() => setActiveCallId(null)}
            />
          )}
        </main>

        {isEscalating && (
          <div className="cp-escalation-overlay" role="alert" aria-live="assertive">
            <div className="cp-escalation-pulse" />
            <p className="cp-escalation-text">Transferring you to a human agent…</p>
          </div>
        )}
      </div>
    </>
  )
}
