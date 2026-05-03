import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  useRoomContext,
  useConnectionState,
  useTracks,
  useAudioWaveform,
  AudioTrack,
} from '@livekit/components-react'
import { Track, ConnectionState, RoomEvent } from 'livekit-client'
import { joinCall, endCall, getCurrentCall } from '../api/call.js'
import { LIVEKIT_URL } from '../config.js'

const css = `
  .vc-root {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 32px 24px;
    gap: 32px;
  }

  /* ── Idle / error state ── */
  .vc-idle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .vc-idle-ring {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(45,212,191,0.04);
  }

  .vc-start-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 13px 32px;
    background: linear-gradient(135deg, #2DD4BF, #0EA5E9);
    border: none;
    border-radius: 50px;
    color: #070A0F;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }

  .vc-start-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.03); }
  .vc-start-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  .vc-error-msg {
    font-size: 13px;
    color: #FCA5A5;
    padding: 10px 16px;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.14);
    border-radius: 8px;
    text-align: center;
    max-width: 340px;
    margin: 0;
  }

  .vc-info-msg {
    font-size: 13px;
    color: rgba(255,200,100,0.85);
    padding: 10px 16px;
    background: rgba(255,200,100,0.05);
    border: 1px solid rgba(255,200,100,0.13);
    border-radius: 8px;
    text-align: center;
    max-width: 340px;
    margin: 0;
  }

  .vc-btn-spinner {
    width: 13px;
    height: 13px;
    border: 1.5px solid rgba(7,10,15,0.25);
    border-top-color: #070A0F;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Active call state ── */
  .vc-active {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    width: 100%;
    max-width: 380px;
  }

  .vc-connecting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: rgba(255,255,255,0.28);
    font-size: 13px;
    font-weight: 300;
  }

  .vc-conn-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(45,212,191,0.12);
    border-top-color: #2DD4BF;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }

  /* Waveform visualizer */
  .vc-waveform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 72px;
  }

  .vc-wbar {
    width: 4px;
    border-radius: 3px;
    background: linear-gradient(to top, #0EA5E9, #2DD4BF);
    transition: height 0.05s ease;
    min-height: 4px;
  }

  /* Timer */
  .vc-timer {
    font-family: 'Syne', monospace, sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }

  /* Hang up button */
  .vc-hangup-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 13px 36px;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.25);
    border-radius: 50px;
    color: #FCA5A5;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .vc-hangup-btn:hover {
    background: rgba(248,113,113,0.16);
    border-color: rgba(248,113,113,0.4);
    transform: scale(1.02);
  }

  .vc-mic-denied {
    font-size: 13px;
    color: rgba(255,200,100,0.85);
    padding: 10px 14px;
    background: rgba(255,200,100,0.05);
    border: 1px solid rgba(255,200,100,0.12);
    border-radius: 8px;
    text-align: center;
    max-width: 320px;
    margin: 0;
    line-height: 1.5;
  }

  .vc-call-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .vc-mute-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 13px 28px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50px;
    color: rgba(255,255,255,0.55);
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .vc-mute-btn:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.22);
    color: rgba(255,255,255,0.8);
    transform: scale(1.02);
  }

  .vc-mute-btn.muted {
    background: rgba(45,212,191,0.08);
    border-color: rgba(45,212,191,0.3);
    color: #2DD4BF;
  }

  .vc-mute-btn.muted:hover {
    background: rgba(45,212,191,0.13);
    border-color: rgba(45,212,191,0.45);
  }

  /* ── Dev debug panel ── */
  .vc-debug {
    position: fixed;
    bottom: 12px;
    right: 12px;
    width: 340px;
    max-height: 280px;
    background: rgba(7,10,15,0.92);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
    padding: 8px 0;
    z-index: 200;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.07) transparent;
    backdrop-filter: blur(8px);
  }

  .vc-debug-header {
    padding: 4px 10px 6px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  .vc-debug-row {
    display: flex;
    gap: 7px;
    padding: 3px 10px;
    font-size: 11px;
    font-family: 'DM Mono', 'Fira Mono', monospace;
    line-height: 1.5;
    align-items: baseline;
  }

  .vc-debug-ts {
    color: rgba(255,255,255,0.2);
    flex-shrink: 0;
    font-size: 10px;
  }

  .vc-debug-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    flex-shrink: 0;
    min-width: 76px;
  }

  .vc-debug-row.stt .vc-debug-tag       { color: #60A5FA; }
  .vc-debug-row.stt_partial .vc-debug-tag { color: rgba(96,165,250,0.45); }
  .vc-debug-row.agent_text .vc-debug-tag { color: #2DD4BF; }
  .vc-debug-row.agent_state .vc-debug-tag { color: rgba(167,139,250,0.85); }
  .vc-debug-row.user_state .vc-debug-tag  { color: rgba(251,191,36,0.75); }

  .vc-debug-val {
    color: rgba(255,255,255,0.55);
    word-break: break-word;
  }

  .vc-debug-row.stt .vc-debug-val       { color: rgba(255,255,255,0.82); }
  .vc-debug-row.agent_text .vc-debug-val { color: rgba(255,255,255,0.82); }
  .vc-debug-row.error .vc-debug-tag { color: #FCA5A5; }
  .vc-debug-row.error .vc-debug-val { color: #FCA5A5; }
`

/* Waveform bars driven by useAudioWaveform */
function MicVisualizer({ micTrack }) {
  const { bars } = useAudioWaveform(micTrack)
  const NUM_BARS = 20
  const maxH = 68

  return (
    <div className="vc-waveform" aria-hidden="true">
      {Array.from({ length: NUM_BARS }, (_, i) => {
        const raw = bars[i % bars.length] ?? 0
        const h = Math.max(4, Math.round(raw * maxH))
        return <div key={i} className="vc-wbar" style={{ height: `${h}px` }} />
      })}
    </div>
  )
}

/* Inner component — lives inside <LiveKitRoom> so hooks work */
function VoiceCallRoom({ onHangUp, onMicDenied }) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const [elapsed, setElapsed] = useState(0)
  const [micErrMsg, setMicErrMsg] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [debugLog, setDebugLog] = useState([])
  const micInitRef = useRef(false)

  const micTracks = useTracks([Track.Source.Microphone], { onlySubscribed: false })
  const remoteTracks = useTracks(
    [Track.Source.Microphone, Track.Source.Unknown],
    { onlySubscribed: true }
  )
  const localMicTrack = micTracks.find(t => t.participant.isLocal)

  /* Enable mic once connected */
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || micInitRef.current) return
    micInitRef.current = true
    room.localParticipant.setMicrophoneEnabled(true).catch(err => {
      if (err.name === 'NotAllowedError') {
        onMicDenied()
      } else {
        setMicErrMsg('Failed to enable microphone. Please check your device settings.')
      }
    })
  }, [connectionState])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    function onData(payload, _participant, _kind, topic) {
      if (topic !== 'debug') return
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        const rowType = msg.type === 'stt' && !msg.final ? 'stt_partial' : msg.type
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setDebugLog(prev => [...prev.slice(-99), { ...msg, rowType, ts, id: Date.now() + Math.random() }])
      } catch {}
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => room.off(RoomEvent.DataReceived, onData)
  }, [room])

  async function toggleMute() {
    const next = !isMuted
    await room.localParticipant.setMicrophoneEnabled(!next)
    setIsMuted(next)
  }

  /* Elapsed timer */
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [connectionState])

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const isConnecting = connectionState === ConnectionState.Connecting
    || connectionState === ConnectionState.Disconnected

  return (
    <div className="vc-active">
      {/* Render remote agent audio tracks */}
      {remoteTracks
        .filter(t => !t.participant.isLocal && t.publication?.trackSid)
        .map(t => (
          <AudioTrack key={t.publication.trackSid} trackRef={t} style={{ display: 'none' }} />
        ))}

      {isConnecting ? (
        <div className="vc-connecting">
          <div className="vc-conn-spinner" />
          <span>Connecting…</span>
        </div>
      ) : (
        <>
          {localMicTrack
            ? <MicVisualizer micTrack={localMicTrack} />
            : <div className="vc-waveform" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="vc-wbar" style={{ height: '4px' }} />
                ))}
              </div>
          }

          <div className="vc-timer" aria-live="off">{hh}:{mm}:{ss}</div>

          {micErrMsg && <p className="vc-mic-denied">{micErrMsg}</p>}

          <div className="vc-call-actions">
            <button
              className={`vc-mute-btn${isMuted ? ' muted' : ''}`}
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0v-4A2.5 2.5 0 0 1 8 1z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
                    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M4 8a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Unmute
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0v-4A2.5 2.5 0 0 1 8 1z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
                    <path d="M4 8a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                    <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Mute
                </>
              )}
            </button>

            <button className="vc-hangup-btn" onClick={() => onHangUp(room)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2.5 11.5C4.2 13.2 6.3 14.5 9 14.5C11.7 14.5 13.8 13.2 15.5 11.5L13.2 9.2C12.4 10 11.2 10 10.5 9.2L9.8 8.5C9 7.7 9 6.5 9.8 5.8L7.5 3.5C5.8 5.2 2.5 7.2 2.5 9.5C2.5 10.2 2.5 10.8 2.5 11.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
              </svg>
              Hang up
            </button>
          </div>
        </>
      )}

      {import.meta.env.DEV && debugLog.length > 0 && (
        <div className="vc-debug" role="log" aria-label="Dev debug log">
          {[...debugLog].reverse().map(e => (
            <div key={e.id} className={`vc-debug-row ${e.rowType}`}>
              <span className="vc-debug-ts">{e.ts}</span>
              <span className="vc-debug-tag">{e.rowType.replace('_', ' ')}</span>
              <span className="vc-debug-val">{e.text ?? e.state}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Outer component — manages join/end lifecycle */
export default function VoiceCall({ onCallStarted, onCallEnded, activeCallId }) {
  const [status, setStatus] = useState('idle') // idle | joining | live | micdenied | error
  const [roomToken, setRoomToken] = useState(null)
  const [error, setError] = useState('')
  const [hasConflict, setHasConflict] = useState(false)
  const [endingConflict, setEndingConflict] = useState(false)

  async function handleStart() {
    setStatus('joining')
    setError('')
    setHasConflict(false)
    try {
      const data = await joinCall()
      onCallStarted(data.call_id)
      setRoomToken(data.token)
      setStatus('live')
    } catch (err) {
      if (err.response?.status === 400) {
        setHasConflict(true)
        setError('You already have an active call.')
      } else {
        setError('Failed to start call. Please try again.')
      }
      setStatus('error')
    }
  }

  async function handleEndAndRetry() {
    setEndingConflict(true)
    try {
      const current = await getCurrentCall()
      await endCall(current.call_id)
      onCallEnded()
    } catch { /* swallow */ }
    setEndingConflict(false)
    setHasConflict(false)
    handleStart()
  }

  async function handleHangUp(room) {
    room.disconnect()
    try { await endCall(activeCallId) } catch {}
    setStatus('idle')
    setRoomToken(null)
    onCallEnded()
  }

  function handleMicDenied() {
    if (activeCallId) {
      endCall(activeCallId).catch(() => {})
      onCallEnded()
    }
    setRoomToken(null)
    setStatus('micdenied')
  }

  return (
    <>
      <style>{css}</style>
      <div className="vc-root">
        {status !== 'live' && (
          <div className="vc-idle">
            <div className="vc-idle-ring">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M8 20 Q14 10 20 20 Q26 30 32 20" stroke="#2DD4BF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            {status === 'micdenied' && (
              <p className="vc-info-msg">
                Microphone access was denied. Please allow mic access in your browser and try again.
              </p>
            )}

            {status === 'error' && error && (
              <p className="vc-error-msg">{error}</p>
            )}

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

            <button
              className="vc-start-btn"
              onClick={handleStart}
              disabled={status === 'joining'}
            >
              {status === 'joining' ? (
                <><span className="vc-btn-spinner" aria-hidden="true" />Connecting…</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" opacity="0.6" />
                    <path d="M3 8 Q5.5 4 8 8 Q10.5 12 13 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </svg>
                  Start call
                </>
              )}
            </button>
          </div>
        )}

        {status === 'live' && roomToken && (
          <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={roomToken}
            connect={true}
            audio={false}
            video={false}
          >
            <VoiceCallRoom onHangUp={handleHangUp} onMicDenied={handleMicDenied} />
          </LiveKitRoom>
        )}
      </div>
    </>
  )
}
