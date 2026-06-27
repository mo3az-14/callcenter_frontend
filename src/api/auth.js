import client from './client.js'

export async function signup(email, password, firstName, lastName) {
  const res = await client.post('/auth/signup', {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  })
  return res.data
}

export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password })
  return res.data
}

export async function logout() {
  await client.post('/auth/logout')
}
