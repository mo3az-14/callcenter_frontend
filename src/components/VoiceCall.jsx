import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  useRoomContext,
  useConnectionState,
  useTracks,
  AudioTrack,
} from '@livekit/components-react'
import { Track, ConnectionState, RoomEvent } from 'livekit-client'
import { joinCall, endCall, getCurrentCall } from '../api/call.js'
import { LIVEKIT_URL } from '../config.js'
import { Orb, stateLine } from '../components/Orb.jsx'
import { Mic, MicOff, HangUp } from '../components/Icons.jsx'

function BgRadial() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 55%, var(--c-glow-2) 0%, transparent 55%)',
    }}/>
  )
}

function VoiceCallRoom({ onHangUp, onMicDenied, agentState, onAgentStateChange, elapsed, setElapsed }) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const [micErrMsg, setMicErrMsg] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const micInitRef = useRef(false)

  const remoteTracks = useTracks(
    [Track.Source.Microphone, Track.Source.Unknown],
    { onlySubscribed: true }
  )

  // Enable mic once connected
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || micInitRef.current) return
    micInitRef.current = true
    room.localParticipant.setMicrophoneEnabled(true).catch(err => {
      if (err.name === 'NotAllowedError') onMicDenied()
      else setMicErrMsg('Failed to enable microphone. Check your device settings.')
    })
  }, [connectionState])

  // Parse agent state from LiveKit data channel
  useEffect(() => {
    function onData(payload, _participant, _kind, topic) {
      if (topic !== 'debug') return
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.type === 'agent_state' && msg.state) {
          const map = {
            listening: 'listening',
            speaking: 'speaking',
            thinking: 'thinking',
            user_speaking: 'user_speaking',
          }
          onAgentStateChange(map[msg.state] || msg.state, elapsed)
        }
      } catch {}
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => room.off(RoomEvent.DataReceived, onData)
  }, [room, elapsed])

  // Elapsed timer
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [connectionState])

  const fmt = (s) => {
    const m = Math.floor(s / 60), ss = s % 60, h = Math.floor(m / 60)
    return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  const isConnecting = connectionState === ConnectionState.Connecting
    || connectionState === ConnectionState.Disconnected

  async function toggleMute() {
    const next = !isMuted
    await room.localParticipant.setMicrophoneEnabled(!next)
    setIsMuted(next)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 'min(28px, 3vh)', padding: '20px 20px 28px',
    }}>
      {remoteTracks
        .filter(t => !t.participant.isLocal && t.publication?.trackSid)
        .map(t => <AudioTrack key={t.publication.trackSid} trackRef={t} style={{ display: 'none' }}/>)}

      {isConnecting ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--fg-3)', fontSize: 13, fontWeight: 300 }}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(94,234,212,0.12)', borderTopColor: 'var(--c)', borderRadius: '50%', animation: 'ringRotate 0.65s linear infinite' }}/>
          <span>connecting…</span>
        </div>
      ) : (
        <>
          <span className="chip live">on call</span>
          <div className="display fade-in" key={agentState} style={{
            fontSize: 'clamp(22px, 3.2vh, 28px)', color: 'var(--fg-2)',
            fontStyle: 'italic', whiteSpace: 'nowrap', lineHeight: 1.1,
          }}>
            {stateLine(agentState)}.
          </div>

          <Orb state={agentState} size={200}/>

          <div className="mono" style={{
            fontSize: 'clamp(18px, 2.5vh, 24px)',
            letterSpacing: '0.08em', color: 'var(--fg-2)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(elapsed)}
          </div>

          {micErrMsg && (
            <p style={{ fontSize: 13, color: 'var(--fg-3)', padding: '10px 16px', background: 'rgba(255,200,100,0.05)', border: '1px solid rgba(255,200,100,0.12)', borderRadius: 8, textAlign: 'center', maxWidth: 320, margin: 0 }}>
              {micErrMsg}
            </p>
          )}

          <div className="row gap-m" style={{ alignItems: 'center' }}>
            <button className={`btn${isMuted ? ' primary' : ''}`} onClick={toggleMute}>
              {isMuted ? <MicOff size={14}/> : <Mic size={14}/>}&nbsp;{isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className="btn danger" onClick={() => onHangUp(room)}>
              <HangUp size={14}/>&nbsp;Hang up
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function VoiceCall({ isActive, onCallStarted, onCallEnded, activeCallId, agentState, onAgentStateChange, elapsed, setElapsed, isEscalating }) {
  const [status, setStatus] = useState('idle')
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
    } catch {}
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

  // Space bar to start call when idle (only when voice tab is active)
  useEffect(() => {
    function onKey(e) {
      if (!isActive) return
      if (e.key === ' ' && status === 'idle') {
        const tag = (e.target?.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return
        e.preventDefault()
        handleStart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, isActive])

  if (status !== 'live') {
    return (
      <div className="grow center fade-up" style={{ flexDirection: 'column', gap: 36, padding: 24, position: 'relative', textAlign: 'center' }}>
        <BgRadial/>

        <div style={{ zIndex: 1 }}>
          <div className="display" style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}>
            Ready when<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--c)' }}>you are.</span>
          </div>
          <div style={{ color: 'var(--fg-3)', maxWidth: 340, margin: '0 auto', fontSize: 15 }}>
            Tap the orb to start a voice call. We'll listen first.
          </div>
        </div>

        {status === 'micdenied' && (
          <p style={{ color: 'var(--fg-3)', fontSize: 13, padding: '10px 16px', background: 'rgba(255,200,100,0.05)', border: '1px solid rgba(255,200,100,0.12)', borderRadius: 8, maxWidth: 340, zIndex: 1, margin: 0 }}>
            Microphone access was denied. Please allow mic access in your browser and try again.
          </p>
        )}

        {status === 'error' && error && (
          <p style={{ fontSize: 13, color: 'var(--danger)', padding: '10px 16px', background: 'rgba(239,83,80,0.06)', border: '1px solid rgba(239,83,80,0.14)', borderRadius: 8, maxWidth: 340, zIndex: 1, margin: 0 }}>
            {error}
          </p>
        )}

        {hasConflict && (
          <button
            onClick={handleEndAndRetry}
            disabled={endingConflict}
            className="btn danger sm"
            style={{ zIndex: 1 }}
          >
            {endingConflict ? 'Ending call…' : 'End active call and retry'}
          </button>
        )}

        <button
          onClick={handleStart}
          disabled={status === 'joining'}
          style={{ appearance: 'none', background: 'transparent', border: 0, cursor: status === 'joining' ? 'not-allowed' : 'pointer', padding: 0, zIndex: 1, opacity: status === 'joining' ? 0.6 : 1 }}
        >
          <Orb state="idle" size={220}/>
        </button>

        <div className="row gap-s" style={{ alignItems: 'center', zIndex: 1, color: 'var(--fg-4)', fontSize: 12.5 }}>
          <span className="kbd">space</span>
          <span>to start ·</span>
          <span className="kbd">D</span>
          <span>to show details</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grow" style={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
      <BgRadial/>
      <LiveKitRoom serverUrl={LIVEKIT_URL} token={roomToken} connect={true} audio={false} video={false}
                   style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <VoiceCallRoom
          onHangUp={handleHangUp}
          onMicDenied={handleMicDenied}
          agentState={agentState}
          onAgentStateChange={onAgentStateChange}
          elapsed={elapsed}
          setElapsed={setElapsed}
        />
      </LiveKitRoom>
    </div>
  )
}
