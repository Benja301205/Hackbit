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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        {/* Logo / Icono */}
        <div className="w-24 h-24 glass-card flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] animate-scaleIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight leading-tight">
          Hackbit<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-zinc-500 mb-12 text-center text-sm uppercase tracking-widest font-medium">
          Shadow Forest Edition
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => navigate('/crear-grupo')}
            className="w-full py-4 btn-aesthetic text-base tracking-widest hover:scale-[1.02]"
          >
            Crear grupo
          </button>

          {codigoVisible && (
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeHolder="CÓDIGO"
              maxLength={6}
              autoFocus
              className="w-full py-4 px-4 text-center text-lg font-mono tracking-[0.5em] bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-all animate-scaleIn"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = codigo || e.target.value
                  if (val.trim().length > 0) {
                    navigate(`/unirse/${val.trim().toUpperCase()}`)
                  }
                }
              }}
            />
          )}

          <button
            onClick={() => {
              if (codigoVisible && codigo.trim().length > 0) {
                navigate(`/unirse/${codigo.trim().toUpperCase()}`)
              } else {
                setCodigoVisible(!codigoVisible)
              }
            }}
            className="w-full py-4 bg-transparent hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white text-sm font-medium uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700"
          >
            {codigoVisible ? 'Confirmar código' : 'Unirme a un grupo'}
          </button>

          {user && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 text-emerald-500/50 hover:text-emerald-500 text-xs font-medium uppercase tracking-widest transition-colors mt-4"
            >
              Volver al Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
