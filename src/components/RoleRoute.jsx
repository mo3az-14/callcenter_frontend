import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RoleRoute({ children }) {
  const { role } = useAuth()
  return role === 'admin' ? children : <Navigate to="/call" replace />
}
