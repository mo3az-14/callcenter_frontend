import client from './client.js'

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
