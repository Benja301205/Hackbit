import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'
import { PUNTOS_POR_NIVEL } from '../lib/utils'

export default function EditarGrupo() {
  const navigate = useNavigate()
  const { user, loading: loadingSession } = useSession()

  const [nombre, setNombre] = useState('')
  const [premio, setPremio] = useState('')
  const [premioAnual, setPremioAnual] = useState('')
  const [habitos, setHabitos] = useState([])
  const [habitosOriginales, setHabitosOriginales] = useState([])
  const [nuevosHabitos, setNuevosHabitos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loadingSession && !user) {
      navigate('/', { replace: true })
      return
    }
    if (user) {
      if (user.id !== user.groups?.created_by) {
        navigate('/grupo', { replace: true })
        return
      }
      cargarDatos()
    }
  }, [loadingSession, user])

  const cargarDatos = async () => {
    const grupo = user.groups
    setNombre(grupo.name)
    setPremio(grupo.prize || '')
    setPremioAnual(grupo.annual_prize || '')

    const { data: h } = await supabase
      .from('habits')
      .select('*')
      .eq('group_id', user.group_id)
      .order('level')

    setHabitos(h || [])
    setHabitosOriginales(h || [])
    setLoading(false)
  }

  const actualizarHabito = (id, field, value) => {
    setHabitos(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  const eliminarHabito = (id) => {
    setHabitos(prev => prev.filter(h => h.id !== id))
  }

  const agregarNuevoHabito = () => {
    setNuevosHabitos([...nuevosHabitos, { name: '', level: 1, tempId: Date.now() }])
  }

  const actualizarNuevoHabito = (tempId, field, value) => {
    setNuevosHabitos(prev => prev.map(h => h.tempId === tempId ? { ...h, [field]: value } : h))
  }

  const eliminarNuevoHabito = (tempId) => {
    setNuevosHabitos(prev => prev.filter(h => h.tempId !== tempId))
  }

  const handleGuardar = async () => {
    if (!nombre.trim() || !premio.trim()) return
    setGuardando(true)
    setError(null)

    try {
      // Actualizar grupo
      const { error: errGrupo } = await supabase
        .from('groups')
        .update({
          name: nombre.trim(),
          prize: premio.trim(),
          annual_prize: premioAnual.trim() || null,
        })
        .eq('id', user.group_id)

      if (errGrupo) throw errGrupo

      // Hábitos eliminados
      const idsActuales = habitos.map(h => h.id)
      const idsEliminados = habitosOriginales
        .filter(h => !idsActuales.includes(h.id))
        .map(h => h.id)

      if (idsEliminados.length > 0) {
        await supabase.from('habits').delete().in('id', idsEliminados)
      }

      // Hábitos modificados
      for (const h of habitos) {
        const original = habitosOriginales.find(o => o.id === h.id)
        if (original && (original.name !== h.name || original.level !== h.level)) {
          await supabase.from('habits').update({ name: h.name, level: h.level }).eq('id', h.id)
        }
      }

      // Hábitos nuevos
      const nuevosValidos = nuevosHabitos.filter(h => h.name.trim())
      if (nuevosValidos.length > 0) {
        await supabase.from('habits').insert(
          nuevosValidos.map(h => ({
            group_id: user.group_id,
            name: h.name.trim(),
            level: h.level,
          }))
        )
      }

      navigate('/grupo', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al guardar')
      setGuardando(false)
    }
  }

  if (loadingSession || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8 pb-24 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.05)_0%,_transparent_50%)]">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={() => navigate('/grupo')}
          className="text-zinc-500 hover:text-white mb-8 text-sm flex items-center gap-2 transition-colors uppercase tracking-widest font-medium"
        >
          <span>←</span> Volver
        </button>

        <h1 className="text-3xl font-bold mb-8 text-white tracking-tight">Editar grupo</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-error">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Nombre del grupo */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Premio por ronda */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Premio por ronda
            </label>
            <input
              type="text"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Premio anual */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
              Premio anual{' '}
              <span className="text-zinc-600 font-normal lowercase tracking-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={premioAnual}
              onChange={(e) => setPremioAnual(e.target.value)}
              className="w-full py-4 px-5 bg-zinc-900/50 border border-white/10 rounded-2xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 transition-colors"
            />
          </div>

          {/* Hábitos existentes */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">
              Hábitos
            </label>
            <div className="space-y-3">
              {habitos.map((habito, index) => (
                <div
                  key={habito.id}
                  className="glass-card p-4 space-y-3 stagger-item"
                  style={{ '--i': index }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) => actualizarHabito(habito.id, 'name', e.target.value)}
                      className="flex-1 py-3 px-4 bg-zinc-900/50 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:outline-none text-white text-sm transition-colors"
                    />
                    <button
                      onClick={() => eliminarHabito(habito.id)}
                      className="text-zinc-600 hover:text-red-500 p-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => actualizarHabito(habito.id, 'level', nivel)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          habito.level === nivel
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]}pts)
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Hábitos nuevos */}
              {nuevosHabitos.map((habito) => (
                <div
                  key={habito.tempId}
                  className="glass-card p-4 space-y-3 border-emerald-500/20 animate-scaleIn"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={habito.name}
                      onChange={(e) => actualizarNuevoHabito(habito.tempId, 'name', e.target.value)}
                      placeholder="Nombre del hábito"
                      className="flex-1 py-3 px-4 bg-zinc-900/50 border border-white/10 rounded-xl focus:border-emerald-500/50 focus:outline-none text-white placeholder-zinc-700 text-sm transition-colors"
                    />
                    <button
                      onClick={() => eliminarNuevoHabito(habito.tempId)}
                      className="text-zinc-600 hover:text-red-500 p-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => actualizarNuevoHabito(habito.tempId, 'level', nivel)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          habito.level === nivel
                            ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        Nv.{nivel} ({PUNTOS_POR_NIVEL[nivel]}pts)
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={agregarNuevoHabito}
              className="mt-4 w-full py-3 border border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl text-zinc-500 hover:text-emerald-500 text-sm font-medium transition-colors uppercase tracking-widest"
            >
              + Agregar hábito
            </button>
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={guardando || !nombre.trim() || !premio.trim()}
            className="w-full py-4 btn-aesthetic text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] mt-8"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
