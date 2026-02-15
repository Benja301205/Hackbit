import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export default function RequireAuth() {
  const { loading } = useSession()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const token = localStorage.getItem('session_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
