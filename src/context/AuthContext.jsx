import { createContext, useContext, useState } from 'react'
import { STORAGE_PREFIX } from '../config.js'
import { logout as apiLogout } from '../api/auth.js'

const TOKEN_KEY   = `${STORAGE_PREFIX}token`
const USER_ID_KEY = `${STORAGE_PREFIX}user_id`
const ROLE_KEY    = `${STORAGE_PREFIX}role`
const EMAIL_KEY   = `${STORAGE_PREFIX}email`

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token,  setToken]  = useState(() => localStorage.getItem(TOKEN_KEY))
  const [userId, setUserId] = useState(() => Number(localStorage.getItem(USER_ID_KEY)) || null)
  const [role,   setRole]   = useState(() => localStorage.getItem(ROLE_KEY) || null)
  const [email,  setEmail]  = useState(() => localStorage.getItem(EMAIL_KEY) || null)

  function login(newToken, newUserId, newRole, newEmail) {
    localStorage.setItem(TOKEN_KEY,   newToken)
    localStorage.setItem(USER_ID_KEY, newUserId)
    localStorage.setItem(ROLE_KEY,    newRole)
    localStorage.setItem(EMAIL_KEY,   newEmail || '')
    setToken(newToken)
    setUserId(newUserId)
    setRole(newRole)
    setEmail(newEmail || null)
  }

  async function logout() {
    try { await apiLogout() } catch {}
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setToken(null)
    setUserId(null)
    setRole(null)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, userId, role, email, isAuthenticated: token !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
