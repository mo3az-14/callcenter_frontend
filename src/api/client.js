import axios from 'axios'
import { API_BASE_URL, STORAGE_PREFIX } from '../config.js'

const TOKEN_KEY   = `${STORAGE_PREFIX}token`
const USER_ID_KEY = `${STORAGE_PREFIX}user_id`
const ROLE_KEY    = `${STORAGE_PREFIX}role`
const EMAIL_KEY   = `${STORAGE_PREFIX}email`

const client = axios.create({
  baseURL: API_BASE_URL,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function fireToast(message, type = 'error') {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }))
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/signup')
    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_ID_KEY)
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(EMAIL_KEY)
      window.location.replace('/login')
    } else if (status === 403) {
      fireToast('Not authorised to perform this action.')
    } else if (!error.response) {
      fireToast('Connection error — please check your network and retry.')
    }
    return Promise.reject(error)
  },
)

export default client
