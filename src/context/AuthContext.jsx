import { createContext, useContext, useState } from 'react'
import { STORAGE_PREFIX } from '../config.js'

const TOKEN_KEY = `${STORAGE_PREFIX}token`
const USER_ID_KEY = `${STORAGE_PREFIX}user_id`
const ROLE_ID_KEY = `${STORAGE_PREFIX}role_id`

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [userId, setUserId] = useState(() => Number(localStorage.getItem(USER_ID_KEY)) || null)
  const [roleId, setRoleId] = useState(() => Number(localStorage.getItem(ROLE_ID_KEY)) || null)

  function login(newToken, newUserId, newRoleId) {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_ID_KEY, newUserId)
    localStorage.setItem(ROLE_ID_KEY, newRoleId)
    setToken(newToken)
    setUserId(newUserId)
    setRoleId(newRoleId)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(ROLE_ID_KEY)
    setToken(null)
    setUserId(null)
    setRoleId(null)
  }

  return (
    <AuthContext.Provider value={{ token, userId, roleId, isAuthenticated: token !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
