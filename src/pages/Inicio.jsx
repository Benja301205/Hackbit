import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

export default function Inicio() {
  const navigate = useNavigate()
  const { user, loading } = useSession()
  const [codigoVisible, setCodigoVisible] = useState(false)
  const [codigo, setCodigo] = useState('')

  const handleUnirse = () => {
    if (codigoVisible) {
      if (codigo.trim().length > 0) {
        navigate(`/unirse/${codigo.trim().toUpperCase()}`)
      }
    } else {
      setCodigoVisible(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo / Icono */}
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-emerald-600">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center leading-tight">
          Competencia de Hábitos
        </h1>
        <p className="text-gray-500 mb-10 text-center text-base">
          Competí con tus amigos para cumplir hábitos saludables
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/crear-grupo')}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors"
          >
            Crear grupo
          </button>

          {codigoVisible && (
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código de invitación"
              maxLength={6}
              autoFocus
              className="w-full py-4 px-4 text-center text-lg font-mono tracking-widest border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none uppercase bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnirse()
              }}
            />
          )}

          <button
            onClick={handleUnirse}
            className="w-full py-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-emerald-600 text-lg font-semibold rounded-2xl border-2 border-emerald-500 transition-colors"
          >
            Unirme a un grupo
          </button>

          {user && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-lg font-semibold rounded-2xl transition-colors"
            >
              Ir al Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
