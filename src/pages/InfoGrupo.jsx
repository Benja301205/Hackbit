import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'
import BottomNav from '../components/BottomNav'

export default function InfoGrupo() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()
  const [habitos, setHabitos] = useState([])
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) cargarInfo()
  }, [loadingSession, user])

  const cargarInfo = async () => {
    const [habitosRes, miembrosRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('group_id', user.group_id)
        .order('level'),
      supabase
        .from('users')
        .select('id, nickname, created_at')
        .eq('group_id', user.group_id)
        .order('created_at'),
    ])

    setHabitos(habitosRes.data || [])
    setMiembros(miembrosRes.data || [])
    setLoading(false)
  }

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(user.groups.invite_code)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {}
  }

  const compartirLink = async () => {
    const url = `${window.location.origin}/unirse/${user.groups.invite_code}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Competencia de Hábitos',
          text: `Unite a mi grupo "${user.groups.name}"`,
          url,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const borrarFotosGrupo = async (groupId) => {
    // Listar usuarios para encontrar sub-carpetas
    const { data: usuarios } = await supabase
      .from('users')
      .select('id')
      .eq('group_id', groupId)

    for (const u of (usuarios || [])) {
      const { data: files } = await supabase.storage
        .from('habit-photos')
        .list(`${groupId}/${u.id}`)
      if (files?.length) {
        const paths = files.map(f => `${groupId}/${u.id}/${f.name}`)
        await supabase.storage.from('habit-photos').remove(paths)
      }
    }
  }

  const handleEliminarGrupo = async () => {
    setProcesando(true)
    try {
      await borrarFotosGrupo(user.group_id)
      await supabase.from('groups').delete().eq('id', user.group_id)
      localStorage.removeItem('active_group_id')
      navigate('/', { replace: true })
    } catch {
      setProcesando(false)
    }
  }

  const handleSalirGrupo = async () => {
    setProcesando(true)
    try {
      const grupo = user.groups

      // Si es el creador, transferir propiedad
      if (user.id === grupo.created_by) {
        const { data: otrosUsuarios } = await supabase
          .from('users')
          .select('id')
          .eq('group_id', user.group_id)
          .neq('id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)

        if (otrosUsuarios?.length > 0) {
          await supabase.from('groups')
            .update({ created_by: otrosUsuarios[0].id })
            .eq('id', user.group_id)
        } else {
          // Último usuario → eliminar grupo completo
          await borrarFotosGrupo(user.group_id)
          await supabase.from('groups').delete().eq('id', user.group_id)
          localStorage.removeItem('active_group_id')
          navigate('/', { replace: true })
          return
        }
      }

      // Eliminar registro del usuario de este grupo
      await supabase.from('users').delete().eq('id', user.id)
      localStorage.removeItem('active_group_id')
      navigate('/', { replace: true })
    } catch {
      setProcesando(false)
    }
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null
  const grupo = user.groups
  const esCreador = user.id === grupo.created_by

  return (
    <div className="min-h-screen pb-20">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">{grupo.name}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {grupo.period === 'weekly' ? 'Rondas semanales' : 'Rondas mensuales'}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Código de invitación */}
        <section className="glass-card p-5 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">
            Código de invitación
          </p>
          <p className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-4">
            {grupo.invite_code}
          </p>
          <div className="flex gap-2">
            <button
              onClick={copiarCodigo}
              className={`flex-1 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors ${copiado ? 'animate-success' : ''}`}
            >
              {copiado ? '¡Copiado!' : 'Copiar código'}
            </button>
            <button
              onClick={compartirLink}
              className="flex-1 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Compartir link
            </button>
          </div>
        </section>

        {/* Hábitos */}
        <section className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Hábitos
            </h2>
            {esCreador && (
              <button
                onClick={() => navigate('/editar-grupo')}
                className="text-emerald-500 text-sm font-medium"
              >
                Editar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {habitos.map((h, index) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 stagger-item"
                style={{ '--i': index }}
              >
                <span className="text-sm font-medium text-zinc-200">{h.name}</span>
                <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 rounded-lg px-2 py-1 uppercase tracking-wider font-bold">
                  Nv.{h.level} · {PUNTOS_POR_NIVEL[h.level]}pts
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Premios */}
        <section className="glass-card p-4 space-y-3">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Premios
          </h2>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Premio por ronda</p>
            <p className="text-sm font-medium text-white">{grupo.prize}</p>
          </div>
          {grupo.annual_prize && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Premio anual</p>
              <p className="text-sm font-medium text-amber-100">{grupo.annual_prize}</p>
            </div>
          )}
        </section>

        {/* Miembros */}
        <section className="glass-card p-4">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">
            Miembros ({miembros.length})
          </h2>
          <div className="space-y-2">
            {miembros.map((m, index) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl stagger-item ${
                  m.id === user.id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900/50 border border-white/5'
                }`}
                style={{ '--i': index }}
              >
                <div className="w-8 h-8 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {m.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">
                  {m.nickname}
                  {m.id === user.id && (
                    <span className="text-zinc-500 font-normal"> (vos)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Acciones */}
        <section className="space-y-3 pb-4">
          <button
            onClick={() => setModalSalir(true)}
            className="w-full py-3 bg-transparent hover:bg-white/5 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white font-medium rounded-2xl transition-colors text-sm"
          >
            Salir del grupo
          </button>
          {esCreador && (
            <button
              onClick={() => setModalEliminar(true)}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-medium rounded-2xl transition-colors text-sm"
            >
              Eliminar grupo
            </button>
          )}
        </section>
      </div>

      {/* Modal eliminar grupo */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6 modal-overlay">
          <div className="glass-card p-6 w-full max-w-sm modal-enter border-red-500/20">
            <h3 className="text-lg font-bold text-white mb-2">Eliminar grupo</h3>
            <p className="text-zinc-400 text-sm mb-6">
              ¿Estás seguro? Se perderán todos los datos del grupo, incluyendo hábitos, fotos y ranking.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(false)}
                disabled={procesando}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarGrupo}
                disabled={procesando}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
              >
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal salir del grupo */}
      {modalSalir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6 modal-overlay">
          <div className="glass-card p-6 w-full max-w-sm modal-enter">
            <h3 className="text-lg font-bold text-white mb-2">Salir del grupo</h3>
            <p className="text-zinc-400 text-sm mb-6">
              ¿Estás seguro que querés salir del grupo?
              {esCreador && ' Como sos el creador, la propiedad se transferirá a otro miembro.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalSalir(false)}
                disabled={procesando}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalirGrupo}
                disabled={procesando}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
              >
                {procesando ? 'Saliendo...' : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
