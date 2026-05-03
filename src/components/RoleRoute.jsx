import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { UPLOAD_ADMIN_ROLE_ID } from '../config.js'

export default function RoleRoute({ children }) {
  const { roleId } = useAuth()
  return roleId >= UPLOAD_ADMIN_ROLE_ID ? children : <Navigate to="/call" replace />
}
