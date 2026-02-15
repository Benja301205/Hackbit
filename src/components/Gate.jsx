import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export default function Gate() {
  const { user, loading } = useSession()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Has session (with or without groups) -> Mis Grupos
  if (user) {
    return <Navigate to="/mis-grupos" replace />
  }

  // Has token but no profile yet -> Mis Grupos (will show empty state)
  const token = localStorage.getItem('session_token')
  if (token) {
    return <Navigate to="/mis-grupos" replace />
  }

  // Nothing -> Login
  return <Navigate to="/login" replace />
}
