import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'

export default function MisGrupos() {
  const navigate = useNavigate()
  const { user, userProfiles, loading, switchGroup, clearSession } = useSession()
  const [codigoVisible, setCodigoVisible] = useState(false)
  const [codigo, setCodigo] = useState('')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleEntrarGrupo = (groupId) => {
    switchGroup(groupId)
    navigate('/dashboard')
  }

  const handleUnirse = () => {
    if (codigoVisible && codigo.trim().length > 0) {
      navigate(`/unirse/${codigo.trim().toUpperCase()}`)
    } else {
      setCodigoVisible(!codigoVisible)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearSession()
    navigate('/login', { replace: true })
  }

  const tieneGrupos = userProfiles.length > 0

  return (
    <div className="flex flex-col items-center min-h-screen px-6 py-12 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Mis Grupos<span className="text-emerald-500">.</span>
            </h1>
            {user && (
              <p className="text-zinc-500 text-sm mt-1">
                {user.nickname || 'Hola'}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest font-medium transition-colors"
          >
            Salir
          </button>
        </div>

        {tieneGrupos ? (
          <>
            {/* Group cards */}
            <div className="space-y-4 mb-8">
              {userProfiles.map((perfil, index) => {
                const isAdmin = perfil.id === perfil.groups?.created_by
                const isActive = user?.group_id === perfil.group_id

                return (
                  <button
                    key={perfil.id}
                    onClick={() => handleEntrarGrupo(perfil.group_id)}
                    className="w-full text-left glass-card p-5 transition-all hover:border-emerald-500/30 active:scale-[0.98] stagger-item"
                    style={{ '--i': index }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white truncate">
                          {perfil.groups?.name || 'Grupo'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isAdmin ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {isAdmin ? 'Admin' : 'Miembro'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-medium text-emerald-400/60 bg-emerald-400/10 rounded-full px-2 py-0.5 border border-emerald-400/20">
                              Activo
                            </span>
                          )}
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-zinc-600 shrink-0">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/crear-grupo')}
                className="w-full py-4 btn-aesthetic text-sm tracking-widest hover:scale-[1.02]"
              >
                Crear nuevo grupo
              </button>

              {codigoVisible && (
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  maxLength={6}
                  autoFocus
                  className="w-full py-4 px-4 text-center text-lg font-mono tracking-[0.5em] bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-all animate-scaleIn"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && codigo.trim().length > 0) {
                      navigate(`/unirse/${codigo.trim().toUpperCase()}`)
                    }
                  }}
                />
              )}

              <button
                onClick={handleUnirse}
                className="w-full py-4 bg-transparent hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white text-sm font-medium uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700"
              >
                {codigoVisible ? 'Confirmar código' : 'Unirme a un grupo'}
              </button>
            </div>
          </>
        ) : (
          /* Empty state - no groups */
          <div className="text-center mt-8">
            <div className="w-20 h-20 glass-card flex items-center justify-center mx-auto mb-6 animate-scaleIn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-zinc-600">
                <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm mb-8">
              No pertenecés a ningún grupo todavía
            </p>

            <div className="space-y-4">
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
                  placeholder="CÓDIGO"
                  maxLength={6}
                  autoFocus
                  className="w-full py-4 px-4 text-center text-lg font-mono tracking-[0.5em] bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-all animate-scaleIn"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && codigo.trim().length > 0) {
                      navigate(`/unirse/${codigo.trim().toUpperCase()}`)
                    }
                  }}
                />
              )}

              <button
                onClick={handleUnirse}
                className="w-full py-4 bg-transparent hover:bg-white/5 active:bg-white/10 text-zinc-400 hover:text-white text-sm font-medium uppercase tracking-widest rounded-2xl border border-zinc-800 transition-all hover:border-zinc-700"
              >
                {codigoVisible ? 'Confirmar código' : 'Unirme a un grupo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
