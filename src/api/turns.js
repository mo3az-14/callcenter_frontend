import client from './client.js'

export async function respond(callId, query) {
  const res = await client.post('/turns/respond', { call_id: callId, query })
  return res.data
}
