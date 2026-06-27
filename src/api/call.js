import client from './client.js'
import { API_BASE_URL, STORAGE_PREFIX } from '../config.js'

export async function joinCall() {
  const res = await client.post('/call/join')
  return res.data
}

export async function startCall() {
  const res = await client.post('/call/start_call')
  return res.data
}

export async function endCall(callId) {
  const res = await client.post('/call/end', null, { params: { call_id: callId } })
  return res.data
}

export async function getCurrentCall() {
  const res = await client.get('/call/current')
  return res.data
}

export async function getCallStatus(callId) {
  const res = await client.get(`/call/${callId}/status`)
  return res.data
}

export function subscribeCallEvents(callId, { onEscalated, onEnded }) {
  const token = localStorage.getItem(`${STORAGE_PREFIX}token`)
  const controller = new AbortController()

  fetch(`${API_BASE_URL}/call/${callId}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trimEnd()
        if (trimmed.startsWith('data:')) {
          try {
            const payload = JSON.parse(trimmed.slice(5).trim())
            if (payload.event === 'escalated') onEscalated?.()
            else if (payload.event === 'ended') onEnded?.()
          } catch {}
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      console.error('[SSE] call events stream error:', err)
    }
  })

  return () => controller.abort()
}
